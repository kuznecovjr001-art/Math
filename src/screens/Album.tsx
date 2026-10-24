import { ISLANDS } from '../content/levels';
import { getMission } from '../content/missions';
import { Emoji, Icon } from '../ui/art';

export function Album({ stickers, onBack }: { stickers: string[]; onBack: () => void }) {
  return (
    <div className="screen album">
      <header className="mission-bar">
        <button className="btn icon" onClick={onBack} aria-label="Назад"><Icon name="home" /></button>
        <h1>Мои наклейки</h1>
      </header>
      {ISLANDS.map((isl) => (
        <section key={isl.id} aria-label={isl.title}>
          <h2 className="album-island">{isl.title}</h2>
          <div className="album-grid">
            {isl.missions.map((id) => {
              const m = getMission(id)!;
              const has = stickers.includes(id);
              return (
                <div key={id} className={`album-slot ${has ? 'has' : ''}`}>
                  {has ? <Emoji code={m.icon} size={88} label={m.title} /> : <span className="album-empty">?</span>}
                  <span>{m.title}</span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
