import { useEffect, type CSSProperties } from 'react';
import { speak } from '../audio/voice';
import { ISLANDS, islandOpen, missionOpen, orderedMissions } from '../content/levels';
import { customArt, missionArt } from '../content/art';
import { getMission } from '../content/missions';
import { isReviewDue, missionCompleted, suggestMissions } from '../engine/progress';
import type { Attempt, Profile } from '../engine/types';
import { Emoji, Icon } from '../ui/art';
import type { PlayMode } from './MissionPlayer';

interface Props {
  profile: Profile;
  attempts: Attempt[];
  stickers: string[];
  now: number;
  onStart: (missionId: string, mode: PlayMode) => void;
  onAlbum: () => void;
  onSwitch: () => void;
}

/** Фон из src/assets/art/bg/<name>-land и -port, если он уже нарисован; CSS выбирает по ориентации. */
function bgVars(name: string): CSSProperties | undefined {
  const land = customArt(`bg/${name}-land`);
  const port = customArt(`bg/${name}-port`) ?? land;
  if (!land && !port) return undefined;
  return { '--bg-land': `url(${land ?? port})`, '--bg-port': `url(${port})` } as CSSProperties;
}

const REASON = { review: 'Вспомним', new: 'Новое', again: 'Ещё раз' };

export function MapScreen({ profile, attempts, stickers, now, onStart, onAlbum, onSwitch }: Props) {
  const own = attempts.filter((a) => a.profileId === profile.id);
  const start0 = profile.startIsland ?? 0;
  const isOpen = (id: string) => missionOpen(own, getMission(id)!, start0);
  const suggestions = suggestMissions(own, orderedMissions(), isOpen, now);

  useEffect(() => {
    speak(suggestions.length > 1 ? 'Выбери, во что поиграем.' : 'Нажми на картинку, чтобы начать.');
    // Озвучиваем только при входе на карту.
  }, []);

  const start = (id: string) => onStart(id, isReviewDue(own, id, now) ? 'review' : 'play');

  return (
    <div className="screen map" style={bgVars('world')}>
      <header className="map-bar">
        <button className="tap avatar mini" onClick={onSwitch} aria-label="Сменить игрока">
          <Emoji code={profile.avatar} size={48} />
        </button>
        <span className="map-name">{profile.name || 'Привет!'}</span>
        <button className="btn album-btn" onClick={onAlbum} aria-label="Альбом наклеек">
          <Emoji code="2B50" size={32} /> {stickers.length}
        </button>
      </header>

      <section className="today" aria-label="Сегодня">
        {suggestions.map((s) => {
          const m = getMission(s.id)!;
          return (
            <button key={s.id} className={`today-card ${s.reason}`} onClick={() => start(s.id)}>
              <Emoji code={missionArt(m)} size={88} />
              <span className="today-title">{m.title}</span>
              <span className="today-reason">{REASON[s.reason]}</span>
            </button>
          );
        })}
      </section>

      {ISLANDS.map((isl, index) => {
        const islOpen = islandOpen(own, index, start0);
        return (
          <section
            key={isl.id}
            className={`island ${islOpen ? '' : 'locked'}`}
            data-island={isl.id}
            style={bgVars(isl.id === 'count' ? 'map' : `map-${isl.id}`)}
            aria-label={isl.title}
          >
            <h2>{!islOpen && <Icon name="lock" size={28} />}{isl.title}</h2>
            <ol className="path">
              {isl.missions.map((id) => {
                const m = getMission(id)!;
                const open = isOpen(id);
                const done = missionCompleted(own, id);
                const due = isReviewDue(own, id, now);
                return (
                  <li key={id} className={`stone ${open ? 'open' : 'locked'} ${done ? 'done' : ''}`}>
                    <button
                      className="tap stone-btn"
                      disabled={!open}
                      onClick={() => start(id)}
                      aria-label={`${m.title}${open ? '' : ', пока закрыто'}`}
                    >
                      <Emoji code={missionArt(m)} size={56} />
                      {done && <span className="stone-star"><Emoji code="2B50" size={26} /></span>}
                      {due && <span className="stone-due">Вспомним</span>}
                      {!open && <span className="stone-lock"><Icon name="lock" size={28} /></span>}
                    </button>
                    <span className="stone-title">{m.title}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
