"""
Проверка записей распознаванием речи (Whisper large-v3-turbo, MIT): совпадает ли сказанное с текстом.
Ловит пропущенные и перепутанные слова, неверные числа, обрывы. Не заменяет прослушивание: ударение,
интонацию и тембр Whisper не оценивает.

  python tts/verify_asr.py tts/out/samples/a-teacher-male tts/out/samples/samples.json --voice a-teacher-male
  python tts/verify_asr.py public/voice/a-teacher-male --phrases tts/out/phrases.json --limit 500
"""
import argparse
import json
import re
import sys
from pathlib import Path

import librosa
import torch
from transformers import pipeline

sys.path.insert(0, str(Path(__file__).parent))
from normalize_ru import normalize  # noqa: E402


def words(t: str) -> list[str]:
    t = t.replace('×', ' умножить на ').replace('+', ' плюс ').replace('=', ' равно ')
    try:
        t = normalize(t)
    except KeyError:  # Whisper услышал число за тысячу: цифры выпадут из слов, фраза уйдёт в несовпадения
        pass
    t = t.lower().replace('ё', 'е')
    return re.findall(r'[а-я]+', t)


def wer(ref: list[str], hyp: list[str]) -> float:
    d = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        prev, d[0] = d[0], i
        for j, h in enumerate(hyp, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r != h))
    return d[len(hyp)] / max(len(ref), 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('audio_dir')
    ap.add_argument('samples', nargs='?')
    ap.add_argument('--voice')
    ap.add_argument('--phrases')
    ap.add_argument('--limit', type=int)
    a = ap.parse_args()
    asr = pipeline('automatic-speech-recognition', model='openai/whisper-large-v3-turbo',
                   torch_dtype=torch.float16, device='cuda:0')
    items = []
    if a.samples:
        for r in json.loads(Path(a.samples).read_text(encoding='utf-8')):
            if r['voice'] == a.voice:
                items.append((Path(a.audio_dir) / f"{r['n']:02d}.wav", r['source']))
    else:
        for p in json.loads(Path(a.phrases).read_text(encoding='utf-8')):
            f = Path(a.audio_dir) / f"{p['key']}.ogg"
            if f.exists():
                items.append((f, p['text']))
        items = items[: a.limit]
    out = Path('tts/out') / f'asr-{Path(a.audio_dir).name}.json'
    # Уже проверенные файлы не распознаём заново: можно запускать по мере генерации корпуса.
    prev = {r['file']: r for r in json.loads(out.read_text(encoding='utf-8'))} if out.exists() and not a.samples else {}
    rows = [prev[f.name] for f, _ in items if f.name in prev]
    total = sum(r['wer'] for r in rows)
    items = [(f, t) for f, t in items if f.name not in prev]
    for f, text in items:
        y, _ = librosa.load(f, sr=16000)
        hyp = asr(y, generate_kwargs={'language': 'russian', 'task': 'transcribe'})['text']
        ref, got = words(text), words(hyp)
        # «по ровну» и «поровну» — одно и то же на слух: сравниваем ещё и без пробелов.
        e = 0.0 if ''.join(ref) == ''.join(got) else wer(ref, got)
        total += e
        rows.append({'file': f.name, 'text': text, 'heard': hyp.strip(), 'wer': round(e, 3)})
        if len(rows) % 500 == 0:  # промежуточное сохранение: сбой не теряет час распознавания
            out.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
    rows.sort(key=lambda r: -r['wer'])
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
    exact = sum(r['wer'] == 0 for r in rows)
    print(f'{a.voice or a.audio_dir}: файлов {len(rows)}, точно {exact}, средний WER {total / max(len(rows), 1):.3f}')
    for r in rows[:5]:
        if r['wer'] > 0:
            print(f"  {r['wer']:.2f}  {r['text']}\n        слышно: {r['heard']}")


if __name__ == '__main__':
    main()
