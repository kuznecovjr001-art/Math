"""
Страница проверки ударений: каждое слово корпуса (в том виде, как его произносит голос, — числа словами)
с коротким отрывком из самой короткой фразы, где оно звучит. Человек слушает подряд и отмечает слова
с неверным ударением; список копируется в чат и уходит в tts/stress.json.

  python tts/stress_page.py e-schetik-soft   → docs/voice-samples/stress-check.html

Отрывок находится по пословным отметкам времени Whisper; если слово не нашлось — играет вся фраза.
Односложные слова и слова с «ё» не проверяются: в них ударение не перепутать.
"""
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import librosa
import torch
from transformers import pipeline

sys.path.insert(0, str(Path(__file__).parent))
from normalize_ru import normalize  # noqa: E402
from verify_asr import words  # noqa: E402

voice = sys.argv[1]
root = Path(__file__).resolve().parent.parent
phrases = json.loads((root / 'tts/out/phrases.json').read_text(encoding='utf-8'))
stress = json.loads((root / 'tts/stress.json').read_text(encoding='utf-8'))
audio_dir = root / 'public/voice' / voice
VOWELS = re.compile(r'[аеиоуыэюя]')


def spoken(text: str) -> str:
    # Как в build_voice.spoken: проверяем ровно то, что произносил голос.
    t = normalize(text.replace('…', '.'))
    for word, fixed in stress.items():
        t = re.sub(rf'\b{re.escape(word)}\b', fixed, t)
    return t


freq: Counter = Counter()
where: dict = defaultdict(list)
for p in phrases:
    if not (audio_dir / f"{p['key']}.ogg").exists():
        continue
    said = spoken(p['text'])
    for w in re.findall(r'[а-яё]+', said.lower()):
        if 'ё' in w or len(VOWELS.findall(w)) < 2:
            continue
        freq[w] += 1
        where[w].append((len(said), p['key'], said))

pick = {w: min(where[w]) for w in freq}
asr = pipeline('automatic-speech-recognition', model='openai/whisper-large-v3-turbo',
               dtype=torch.float16, device='cuda:0')
stamps: dict = {}
for key in sorted({k for _, k, _ in pick.values()}):
    y, _ = librosa.load(audio_dir / f'{key}.ogg', sr=16000)
    out = asr(y, return_timestamps='word', generate_kwargs={'language': 'russian', 'task': 'transcribe'})
    stamps[key] = [(ws, c['timestamp']) for c in out.get('chunks', []) for ws in [words(c['text'])] if ws]


def find(word: str, key: str):
    """Начало и конец слова в записи: точное совпадение, иначе по первым 4 буквам (падеж, цифры у Whisper)."""
    for test in (lambda h: word in h, lambda h: any(x[:4] == word[:4] for x in h)):
        for heard, (s, e) in stamps.get(key, []):
            if test(heard) and s is not None and e is not None:
                return round(max(0.0, s - 0.25), 2), round(e + 0.3, 2)
    return None


rows = []
for w, n in freq.most_common():
    _, key, said = pick[w]
    rows.append({'w': w, 'n': n, 'k': key, 's': said, 't': find(w, key)})
found = sum(r['t'] is not None for r in rows)

page = (root / 'tts/stress_page.html').read_text(encoding='utf-8')
page = page.replace('__VOICE__', voice).replace('__ROWS__', json.dumps(rows, ensure_ascii=False))
(root / 'docs/voice-samples/stress-check.html').write_text(page, encoding='utf-8')
print(f'слов {len(rows)}, отрывок найден у {found}, остальные — целой фразой')
