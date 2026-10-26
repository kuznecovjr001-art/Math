"""
Страница выборочного прослушивания корпуса: по несколько фраз каждого типа (постоянные, похвала, помощь,
авторские и сгенерированные карточки, числа 1/2/5/11/21/25, падежи после «до/от/из/в», умножение) и худшие
по Whisper. Автоматическая проверка не заменяет слух — эту страницу слушает человек.

  python tts/listening_page.py a-teacher-male   → docs/voice-samples/corpus-check.html
"""
import json
import random
import re
import shutil
import sys
from pathlib import Path

voice = sys.argv[1]
root = Path(__file__).resolve().parent.parent
phrases = json.loads((root / 'tts/out/phrases.json').read_text(encoding='utf-8'))
asr_file = root / f'tts/out/asr-{voice}.json'
asr = {r['file'][:-4]: r for r in json.loads(asr_file.read_text(encoding='utf-8'))} if asr_file.exists() else {}
rnd = random.Random(7)

groups = {
    'Постоянные фразы': [p for p in phrases if p['source'].startswith('PHRASE')],
    'Похвала и финал': [p for p in phrases if p['source'].endswith(('.praise', '.finish'))],
    'Помощь': [p for p in phrases if '.help' in p['source']],
    'Авторские карточки': [p for p in phrases if p['source'].endswith('.card')],
    'Сгенерированные карточки': [p for p in phrases if p['source'].endswith('.gen')],
    'Числа 1, 2, 21, 22 (род)': [p for p in phrases if re.search(r'(^|\D)(1|2|21|22)\s+[а-я]', p['text'])],
    'Числа 5, 11, 25': [p for p in phrases if re.search(r'(^|\D)(5|11|25)\s+[а-я]', p['text'])],
    'Падежи после «до/от/из/в»': [p for p in phrases if re.search(r'\b(до|от|из|в)\s+\d', p['text'])],
    'Умножение и деление': [p for p in phrases if 'умножить' in p['text'] or 'разделить' in p['text']],
    'Сотни (100–999)': [p for p in phrases if re.search(r'\d{3}', p['text'])],
}
out = root / 'docs/voice-samples/corpus'
shutil.rmtree(out, ignore_errors=True)
out.mkdir(parents=True)
rows = []
for title, items in groups.items():
    pick = rnd.sample(items, min(6, len(items)))
    rows.append((title, pick))
worst = sorted(asr.values(), key=lambda r: -r['wer'])[:12]
key_of = {p['key']: p for p in phrases}
rows.append(('Худшие по Whisper', [key_of[r['file'][:-4]] for r in worst if r['file'][:-4] in key_of and r['wer'] > 0]))

h = ['<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
     '<title>Голос Счётика — выборочное прослушивание</title><style>body{font:16px/1.45 system-ui,sans-serif;max-width:980px;margin:0 auto;',
     'padding:16px;background:#fff8e8;color:#3a2e1f}td{border-top:1px solid #e7d5ad;padding:6px;vertical-align:top}audio{width:240px;height:34px}',
     '.h{color:#9c3d24;font-size:13px}</style></head><body><h1>Голос Счётика: выборка корпуса</h1>',
     f'<p>Голос {voice}. По 6 случайных фраз каждого типа и худшие по распознаванию. Отметьте на слух: ударения, падежи чисел, '
     'интонацию вопросов, паузы, «роботизированность». Номера плохих фраз — для перегенерации.</p>']
for title, items in rows:
    h.append(f'<h2>{title}</h2><table>')
    for p in items:
        src = root / f"public/voice/{voice}/{p['key']}.ogg"
        if not src.exists():
            continue
        shutil.copy(src, out / src.name)
        heard = asr.get(p['key'])
        note = f'<div class="h">Whisper: {heard["heard"]}</div>' if heard and heard['wer'] > 0 else ''
        h.append(f'<tr><td><audio controls preload="none" src="corpus/{src.name}"></audio></td><td>{p["text"]}{note}<div class="h">{p["key"]}</div></td></tr>')
    h.append('</table>')
(root / 'docs/voice-samples/corpus-check.html').write_text('\n'.join(h), encoding='utf-8')
print('ok', sum(1 for _ in out.iterdir()), 'файлов')
