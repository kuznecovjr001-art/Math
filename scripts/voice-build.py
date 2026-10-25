"""
Записывает озвучку фраз синтезатором Piper (голос ru irina, данные RHVoice).

  npx vite-node scripts/voice-phrases.ts > /tmp/phrases.json
  python3 scripts/voice-build.py /tmp/phrases.json path/to/ru-irinia-medium.onnx

Кладёт public/audio/<ключ>.mp3, manifest.json и phrases.tsv (ключ, текст) —
по этой таблице диктор может перезаписать фразы своим голосом с теми же именами.
"""
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public' / 'audio'


def phrase_key(text: str) -> str:
    h = 0x811C9DC5
    for b in text.strip().encode('utf-8'):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f'{h:08x}'


def main() -> None:
    phrases = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    from piper import PiperVoice, SynthesisConfig

    voice = PiperVoice.load(sys.argv[2])
    # Чуть медленнее обычного: слушают дети.
    cfg = SynthesisConfig(length_scale=1.12)
    OUT.mkdir(parents=True, exist_ok=True)
    keys = {}
    for text in phrases:
        k = phrase_key(text)
        keys[k] = text.strip()
        mp3 = OUT / f'{k}.mp3'
        if mp3.exists():
            continue
        with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
            with wave.open(tmp.name, 'wb') as w:
                voice.synthesize_wav(text.strip(), w, syn_config=cfg)
            subprocess.run(
                ['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp.name, '-ac', '1', '-ar', '22050', '-b:a', '32k', str(mp3)],
                check=True,
            )
    for old in OUT.glob('*.mp3'):
        if old.stem not in keys:
            old.unlink()
    (OUT / 'manifest.json').write_text(
        json.dumps({'voice': 'piper ru irina medium', 'files': sorted(keys)}, ensure_ascii=False), encoding='utf-8')
    (OUT / 'phrases.tsv').write_text(
        'ключ\tтекст\n' + ''.join(f'{k}\t{t}\n' for k, t in sorted(keys.items(), key=lambda x: x[1])), encoding='utf-8')
    print(len(keys), 'phrases')


if __name__ == '__main__':
    main()
