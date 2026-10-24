import { MISSIONS } from '../content/missions';
import { Emoji } from '../ui/art';

export function Album({ stickers, onBack }: { stickers: string[]; onBack: () => void }) {
  return (
    <div className="screen album">
      <header className="mission-bar">
        <button className="btn icon" onClick={onBack} aria-label="Назад">⌂</button>
        <h1>Мои наклейки</h1>
      </header>
      <div className="album-grid">
        {MISSIONS.map((m) => {
          const has = stickers.includes(m.id);
          return (
            <div key={m.id} className={`album-slot ${has ? 'has' : ''}`}>
              {has ? <Emoji code={m.icon} size={88} label={m.title} /> : <span className="album-empty">?</span>}
              <span>{m.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
