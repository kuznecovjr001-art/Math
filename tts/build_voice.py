"""
Озвучка всех фраз одним голосом Счётика (Qwen3-TTS Base + сохранённый клон-промпт голоса).

  python tts/build_voice.py --voice a-teacher-male                 # всё, чего ещё нет
  python tts/build_voice.py --voice a-teacher-male --only KEY ...   # выборочно заново
  python tts/build_voice.py --voice a-teacher-male --limit 200      # пробная партия

Вход: tts/out/phrases.json (scripts/voice-extract.ts). Выход: public/voice/<voice>/<key>.ogg (Opus),
src/audio/voice-keys.json (список озвученных ключей), tts/out/build-report.json.
Запись диктора: положите tts/human/<key>.ogg (или .wav) — она займёт место синтеза без правки кода.
Скрипт можно прервать и запустить снова: готовые файлы не пересоздаются.
"""
import argparse
import json
import re
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

sys.path.insert(0, str(Path(__file__).parent))
from normalize_ru import normalize  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / 'public' / 'voice'
STRESS = ROOT / 'tts' / 'stress.json'
VOICE_DIR = ROOT / 'tts' / 'voices'

# Нормальный темп спокойной детской речи ~10–16 символов в секунду; вне коридора — подозрение на сбой.
MIN_CPS, MAX_CPS = 6.0, 22.0


def spoken(text: str, stress: dict) -> str:
    t = normalize(text.replace('…', '.'))
    for word, fixed in stress.items():
        t = re.sub(rf'\b{re.escape(word)}\b', fixed, t)
    return t


def trim(w: np.ndarray, sr: int, pad_ms=60) -> np.ndarray:
    """Срезает тишину по краям, оставляя короткий запас."""
    a = np.abs(w)
    thr = max(a.max() * 0.02, 1e-4)
    idx = np.where(a > thr)[0]
    if len(idx) == 0:
        return w
    pad = int(sr * pad_ms / 1000)
    return w[max(0, idx[0] - pad): idx[-1] + pad]


def loud(w: np.ndarray, target_rms=0.08) -> np.ndarray:
    rms = float(np.sqrt(np.mean(w ** 2)) or 1e-6)
    return np.clip(w * min(target_rms / rms, 4.0), -0.99, 0.99)


def write_opus(path: Path, w: np.ndarray, sr: int, quality: float):
    """Ogg Opus через libsndfile (без ffmpeg). quality 0…1 — уровень сжатия libsndfile (выше — меньше файл)."""
    import librosa
    path.parent.mkdir(parents=True, exist_ok=True)
    if sr != 48000:
        w = librosa.resample(w, orig_sr=sr, target_sr=48000)
    sf.write(path, w, 48000, format='OGG', subtype='OPUS', compression_level=quality)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', required=True)
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--limit', type=int)
    ap.add_argument('--batch', type=int, default=16)
    # Пакет ограничен и по сумме символов: длинные фразы иначе переполняют 16 ГБ видеопамяти и Windows
    # уводит её в общую память — генерация замедляется в разы.
    ap.add_argument('--chars', type=int, default=700)
    # Несколько процессов на одной видеокарте: --shard 0/2 и --shard 1/2 делят фразы пополам.
    ap.add_argument('--shard', default='0/1')
    ap.add_argument('--compression', type=float, default=0.96)  # ~19 кбит/с Opus: чистая речь, корпус ~140 МБ
    args = ap.parse_args()

    phrases = json.loads((ROOT / 'tts/out/phrases.json').read_text(encoding='utf-8'))
    stress = json.loads(STRESS.read_text(encoding='utf-8')) if STRESS.exists() else {}
    out_dir = PUB / args.voice
    todo = [p for p in phrases if (args.only and p['key'] in args.only)
            or (not args.only and not (out_dir / f"{p['key']}.ogg").exists())]
    k, n = map(int, args.shard.split('/'))
    todo = sorted(todo, key=lambda p: p['key'])[k::n]
    if args.limit:
        todo = todo[:args.limit]
    human = {p.stem: p for p in (ROOT / 'tts/human').glob('*.*')} if (ROOT / 'tts/human').exists() else {}
    print(f'фраз {len(phrases)}, к генерации {len(todo)}, записей диктора {len(human)}', flush=True)

    from qwen_tts import Qwen3TTSModel
    model = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', device_map='cuda:0', dtype=torch.bfloat16)
    # Свой файл, созданный voice_samples.py --save: внутри объект qwen_tts, поэтому weights_only=False.
    prompt = torch.load(VOICE_DIR / f'{args.voice}.pt', weights_only=False)

    report = {'voice': args.voice, 'suspicious': [], 'failed': []}
    t0, done_s = time.time(), 0.0
    todo.sort(key=lambda p: len(p['text']))  # похожая длина в пакете — меньше пустой работы
    todo = [p for p in todo if p['key'] not in human]
    batches, cur = [], []
    for p in todo:
        if cur and (len(cur) >= args.batch or sum(len(x['text']) for x in cur) + len(p['text']) > args.chars):
            batches.append(cur)
            cur = []
        cur.append(p)
    if cur:
        batches.append(cur)
    done_n = 0
    for batch in batches:
        if not batch:
            continue
        texts = [spoken(p['text'], stress) for p in batch]
        try:
            wavs, sr = model.generate_voice_clone(text=texts, language=['Russian'] * len(texts), voice_clone_prompt=prompt)
        except Exception as e:  # noqa: BLE001 — партия не должна останавливать весь корпус
            report['failed'] += [{'key': p['key'], 'error': str(e)[:200]} for p in batch]
            continue
        for p, txt, w in zip(batch, texts, wavs):
            w = loud(trim(np.asarray(w, dtype=np.float32), sr))
            sec = len(w) / sr
            cps = len(txt) / max(sec, 0.1)
            if not (MIN_CPS <= cps <= MAX_CPS):
                report['suspicious'].append({'key': p['key'], 'text': p['text'], 'sec': round(sec, 2), 'cps': round(cps, 1)})
            write_opus(out_dir / f"{p['key']}.ogg", w, sr, args.compression)
            done_s += sec
        torch.cuda.empty_cache()
        done_n += len(batch)
        el = time.time() - t0
        print(f'{done_n}/{len(todo)}  аудио {done_s / 60:.1f} мин  прошло {el / 60:.1f} мин  RTF {el / max(done_s, 1):.2f}', flush=True)

    for key, src in human.items():
        dst = out_dir / f'{key}.ogg'
        if src.suffix == '.ogg':
            dst.write_bytes(src.read_bytes())
        else:
            w, sr = sf.read(src)
            write_opus(dst, w, sr, args.compression)

    files = {p.stem: f'{args.voice}/{p.name}' for p in sorted(out_dir.glob('*.ogg'))}
    # Приложение получает только список ключей (путь = voice/<голос>/<ключ>.ogg): отдельный ленивый чанк.
    (ROOT / 'src/audio/voice-keys.json').write_text(json.dumps(
        {'version': int(time.time()), 'voice': args.voice, 'keys': sorted(files)}, separators=(',', ':')), encoding='utf-8')
    known = {p['key'] for p in phrases}
    report['coverage'] = {'phrases': len(phrases), 'recorded': len(known & files.keys()),
                          'missing': sorted(known - files.keys())[:200], 'human': sorted(human)}
    (ROOT / 'tts/out/build-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"готово: записей {len(files)}, подозрительных {len(report['suspicious'])}, сбоев {len(report['failed'])}")


if __name__ == '__main__':
    main()
