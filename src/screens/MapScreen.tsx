import { useEffect } from 'react';
import { speak } from '../audio/voice';
import { MISSIONS } from '../content/missions';
import {
  isReviewDue, missionCompleted, missionUnlocked, suggestMissions,
} from '../engine/progress';
import type { Attempt, Profile } from '../engine/types';
import { Emoji } from '../ui/art';
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

const REASON = { review: 'Вспомним', new: 'Новое', again: 'Ещё раз' };

export function MapScreen({ profile, attempts, stickers, now, onStart, onAlbum, onSwitch }: Props) {
  const own = attempts.filter((a) => a.profileId === profile.id);
  const suggestions = suggestMissions(own, MISSIONS, now);

  useEffect(() => {
    speak(suggestions.length > 1 ? 'Выбери, во что поиграем.' : 'Нажми на картинку, чтобы начать.');
    // Озвучиваем только при входе на карту.
  }, []);

  const start = (id: string) => onStart(id, isReviewDue(own, id, now) ? 'review' : 'play');

  return (
    <div className="screen map">
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
          const m = MISSIONS.find((x) => x.id === s.id)!;
          return (
            <button key={s.id} className={`today-card ${s.reason}`} onClick={() => start(s.id)}>
              <Emoji code={m.icon} size={88} />
              <span className="today-title">{m.title}</span>
              <span className="today-reason">{REASON[s.reason]}</span>
            </button>
          );
        })}
      </section>

      <section className="island" aria-label="Остров счёта">
        <h2>Остров счёта</h2>
        <ol className="path">
          {MISSIONS.map((m) => {
            const open = missionUnlocked(own, m);
            const done = missionCompleted(own, m.id);
            const due = isReviewDue(own, m.id, now);
            return (
              <li key={m.id} className={`stone ${open ? 'open' : 'locked'} ${done ? 'done' : ''}`}>
                <button
                  className="tap stone-btn"
                  disabled={!open}
                  onClick={() => start(m.id)}
                  aria-label={`${m.title}${open ? '' : ', пока закрыто'}`}
                >
                  <Emoji code={m.icon} size={56} />
                  {done && <span className="stone-star"><Emoji code="2B50" size={26} /></span>}
                  {due && <span className="stone-due">Вспомним</span>}
                  {!open && <span className="stone-lock" aria-hidden="true">🔒</span>}
                </button>
                <span className="stone-title">{m.title}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
