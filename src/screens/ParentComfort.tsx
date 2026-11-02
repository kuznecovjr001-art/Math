import type { Settings } from '../settings';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

const MOTION: [Settings['motion'], string, string][] = [
  ['full', 'Полные', 'Счётик двигается, остров немного оживает'],
  ['moderate', 'Умеренные', 'без постоянных фоновых движений'],
  ['minimal', 'Минимальные', 'только смена картинок, без движения'],
];

/** Анимации, звук и комфорт. Хранятся отдельно от прогресса (settings.ts). */
export function ParentComfort({ settings: s, onChange }: Props) {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...s, [k]: v });
  return (
    <section className="card" aria-labelledby="comfort-h">
      <h2 id="comfort-h">Анимации и звук</h2>
      <fieldset className="plain">
        <legend className="note">Анимации (системная настройка «Убрать анимацию» всегда главнее)</legend>
        {MOTION.map(([v, title, hint]) => (
          <label key={v} className="toggle">
            <input type="radio" name="motion" checked={s.motion === v} onChange={() => set('motion', v)} />
            <span><b>{title}</b> — {hint}.</span>
          </label>
        ))}
      </fieldset>
      <label className="toggle">
        <input type="checkbox" checked={s.voice} onChange={(e) => set('voice', e.target.checked)} />
        Озвучивать задания
      </label>
      <label className="toggle">
        <span>Громкость голоса</span>
        <input
          type="range" min={0.2} max={1} step={0.1} value={s.voiceVolume} disabled={!s.voice}
          onChange={(e) => set('voiceVolume', Number(e.target.value))} aria-label="Громкость голоса"
        />
      </label>
      <label className="toggle">
        <input type="checkbox" checked={s.sfx} onChange={(e) => set('sfx', e.target.checked)} />
        Звуки нажатий и ответов
      </label>
      <h3>Комфорт</h3>
      <label className="toggle">
        <input type="checkbox" checked={!s.ambient} onChange={(e) => set('ambient', !e.target.checked)} />
        Меньше движения на фоне
      </label>
      <label className="toggle">
        <input type="checkbox" checked={!s.parallax} onChange={(e) => set('parallax', !e.target.checked)} />
        Без объёмного сдвига карты при прокрутке
      </label>
      <label className="toggle">
        <input type="checkbox" checked={s.celebrations === 'calm'} onChange={(e) => set('celebrations', e.target.checked ? 'calm' : 'full')} />
        Спокойный праздник в конце миссии
      </label>
    </section>
  );
}
