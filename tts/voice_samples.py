"""
Прототип голоса Счётика: три варианта голоса Qwen3-TTS (VoiceDesign → клон-промпт на Base),
одинаковый набор проверочных фраз, файлы для прослушивания и таблица длительностей и скорости.

  tts-venv/Scripts/python tts/voice_samples.py [папка-вывода]

Модели (Apache-2.0) скачиваются с Hugging Face при первом запуске (~9 ГБ).
"""
import json
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

sys.path.insert(0, str(Path(__file__).parent))
from normalize_ru import normalize  # noqa: E402

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'tts/out/samples')
OUT.mkdir(parents=True, exist_ok=True)

# Счётик в текстах говорит о себе в мужском роде («Я задумал число»), поэтому два мужских варианта
# и один женский для сравнения (с ним пришлось бы менять формы глаголов в фразах).
# Описания на английском: на русские VoiceDesign отвечал голосом не того пола (проверено по высоте тона).
VOICES = {
    'a-teacher-male': 'A warm, calm adult male voice with a gentle baritone. A kind primary school teacher speaking '
                      'Russian slowly and clearly, with natural pauses and a friendly smile in the voice. Not theatrical.',
    'b-storyteller-male': 'A soft, friendly young adult male storyteller with a light tenor voice. Calm pace, tender '
                          'intonation, very clear articulation. Not cartoonish, not squeaky, not like a voice assistant.',
    'c-teacher-female': 'A warm, calm adult female kindergarten teacher with a medium-pitched voice. Slow, clear '
                        'Russian speech, kind and gentle, without exaggerated emotion.',
}
# Ожидаемая высота основного тона, Гц: голос другого пола или «мультяшный» не проходит.
PITCH = {'a-teacher-male': (85, 170), 'b-storyteller-male': (95, 185), 'c-teacher-female': (165, 260)}
REFERENCE = 'Привет! Я Счётик. Давай посчитаем вместе: один, два, три. Посмотри внимательно и не спеши.'

PHRASES = [
    'Привет! Я Счётик. Давай вместе поиграем!',
    'Посмотри внимательно. Сколько яблок лежит на столе?',
    'Отлично! Ты всё правильно посчитал!',
    'Почти получилось. Давай попробуем ещё раз.',
    'Не спеши. Я тебе немного помогу.',
    'Ура! Ты открыл новый остров!',
    '5 + 3 = 8.',
    '7 × 8 — 56.',
    # Числа 1, 2, 5, 11, 21, 25 в разных падежах и родах.
    'У меня 1 яблоко, 2 яблока, 5 яблок, 11 яблок, 21 яблоко и 25 яблок.',
    'На столе 1 груша, 2 груши, 21 груша и 25 груш.',
    'Положи в каждую из 21 коробки по 2 конфеты.',
    'От 11 до 25 не хватает 14.',
    'В 5 коробках по 21 карандашу.',
    'Я задумал число: 2 сотни, 5 десятков и 1 единица. Какое это число?',
    'В двух аквариумах 11 рыбок. В первом 2. Сколько во втором?',
    'Сколько будет 25 плюс 11? Прыгай по числовой прямой: сначала десятками, потом единицами.',
]


def to_text(p: str) -> str:
    return normalize(p.replace('×', ' умножить на ').replace('+', ' плюс ').replace('=', ' равно '))


def main():
    t0 = time.time()
    design = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', device_map='cuda:0', dtype=torch.bfloat16)
    print('languages:', design.get_supported_languages(), flush=True)
    refs = {}
    import librosa
    for name, instruct in VOICES.items():
        lo, hi = PITCH[name]
        for attempt in range(6):
            w, sr = design.generate_voice_design(text=REFERENCE, language='Russian', instruct=instruct)
            y = librosa.resample(np.asarray(w[0], dtype=np.float32), orig_sr=sr, target_sr=16000)
            f0, _, _ = librosa.pyin(y, fmin=60, fmax=400, sr=16000)
            med = float(np.nanmedian(f0))
            print(f'{name}: попытка {attempt + 1}, тон {med:.0f} Гц (нужно {lo}–{hi})', flush=True)
            if lo <= med <= hi:
                break
        sf.write(OUT / f'{name}-reference.wav', w[0], sr)
        refs[name] = (w[0], sr)
    del design
    torch.cuda.empty_cache()

    base = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', device_map='cuda:0', dtype=torch.bfloat16)
    texts = [to_text(p) for p in PHRASES]
    rows = []
    for name, (ref, sr) in refs.items():
        prompt = base.create_voice_clone_prompt(ref_audio=(ref, sr), ref_text=REFERENCE)
        # Сохранённый промпт = один и тот же голос для всего корпуса (build_voice.py --voice <name>).
        (Path(__file__).parent / 'voices').mkdir(exist_ok=True)
        torch.save(prompt, Path(__file__).parent / 'voices' / f'{name}.pt')
        d = OUT / name
        d.mkdir(exist_ok=True)
        t1 = time.time()
        wavs, osr = base.generate_voice_clone(text=texts, language=['Russian'] * len(texts), voice_clone_prompt=prompt)
        spent = time.time() - t1
        audio_s = 0.0
        for i, (src, txt, w) in enumerate(zip(PHRASES, texts, wavs)):
            w = np.asarray(w, dtype=np.float32)
            sf.write(d / f'{i + 1:02d}.wav', w, osr)
            audio_s += len(w) / osr
            rows.append({'voice': name, 'n': i + 1, 'source': src, 'spoken': txt, 'sec': round(len(w) / osr, 2)})
        print(f'{name}: {len(texts)} phrases, audio {audio_s:.1f}s, generated in {spent:.1f}s, RTF {spent / audio_s:.2f}', flush=True)
    (OUT / 'samples.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'total {time.time() - t0:.0f}s')


if __name__ == '__main__':
    main()
