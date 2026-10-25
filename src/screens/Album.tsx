import { ISLANDS } from '../content/levels';
import { getMission } from '../content/missions';
import { customArt, stickerArt } from '../content/art';
import { Emoji, Icon, SceneBg } from '../ui/art';

function EmptySlot() {
  const empty = customArt('sticker/empty');
  return empty ? <img src={empty} width={88} height={88} alt="" className="emoji album-empty-art" /> : <span className="album-empty">?</span>;
}

export function Album({ stickers, onBack }: { stickers: string[]; onBack: () => void }) {
  return (
    <div className="screen album">
      <SceneBg name="album" />
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
                  {has ? <Emoji code={stickerArt(m)} size={88} label={m.title} /> : <EmptySlot />}
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
