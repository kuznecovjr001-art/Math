import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { PHRASE } from '../audio/phrases';
import { speak } from '../audio/voice';
import { ISLANDS, islandOpen, missionOpen } from '../content/levels';
import { customArt, missionArt } from '../content/art';
import { MAP_STOPS, snakeStops, type Stop } from '../content/mapLayout';
import { getMission } from '../content/missions';
import { todaySuggestions } from '../content/plan';
import { isReviewDue, missionDone } from '../engine/progress';
import type { Attempt, MissionSession, Profile } from '../engine/types';
import { bgVars, Emoji, Guide, Icon, SceneBg } from '../ui/art';
import type { PlayMode } from './MissionPlayer';

interface Props {
  profile: Profile;
  attempts: Attempt[];
  sessions: MissionSession[];
  stickers: string[];
  now: number;
  onStart: (missionId: string, mode: PlayMode) => void;
  onAlbum: () => void;
  onSwitch: () => void;
}

const REASON = { review: 'Вспомним', new: 'Новое', again: 'Ещё раз', assigned: 'Задание' };

export function MapScreen({ profile, attempts, sessions, stickers, now, onStart, onAlbum, onSwitch }: Props) {
  const own = attempts.filter((a) => a.profileId === profile.id);
  const start0 = profile.startIsland ?? 0;
  const isOpen = (id: string) => missionOpen(own, getMission(id)!, start0);
  const suggestions = todaySuggestions(profile, own, sessions.filter((s) => s.profileId === profile.id), stickers, now);

  useEffect(() => {
    speak(suggestions.length > 1 ? PHRASE.pick : PHRASE.tap);
    // Озвучиваем только при входе на карту.
  }, []);

  const start = (id: string) => onStart(id, isReviewDue(own, id, now) ? 'review' : 'play');

  /** Камень миссии: на площадке карты (at) или в полосе под картой. */
  const stone = (id: string, at?: Stop) => {
    const m = getMission(id)!;
    const open = isOpen(id);
    const done = missionDone(own, stickers, id);
    const due = isReviewDue(own, id, now);
    const pos = at && ({
      '--lx': `${at.land[0]}%`, '--ly': `${at.land[1]}%`, '--px': `${at.port[0]}%`, '--py': `${at.port[1]}%`,
    } as CSSProperties);
    return (
      <li key={id} className={`stone ${open ? 'open' : 'locked'} ${done ? 'done' : ''} ${at ? 'on-map' : ''}`} style={pos}>
        <button
          className="tap stone-btn"
          disabled={!open}
          onClick={() => start(id)}
          aria-label={`${m.title}${done ? ', пройдено' : ''}${due ? ', пора вспомнить' : ''}${open ? '' : ', пока закрыто'}`}
        >
          <Emoji code={missionArt(m)} size={64} />
          {done && <span className="stone-star"><Icon name="star" size={28} /></span>}
          {due && <span className="stone-due"><Icon name="review" size={18} /><span>Вспомним</span></span>}
          {!open && <span className="stone-lock"><Icon name="lock" size={24} /></span>}
        </button>
        <span className="stone-title" aria-hidden="true">{m.title}</span>
      </li>
    );
  };

  const stoneArt = ['open', 'done', 'locked'].map((k) => customArt(`ui/stone-${k}`));
  const stoneVars = stoneArt.every(Boolean)
    ? ({ '--stone-open': `url(${stoneArt[0]})`, '--stone-done': `url(${stoneArt[1]})`, '--stone-locked': `url(${stoneArt[2]})` } as CSSProperties)
    : undefined;

  return (
    <div className={`screen map ${stoneVars ? 'has-stone-art' : ''}`} style={stoneVars}>
      <SceneBg name="world" />
      <header className="map-bar">
        <button className="tap avatar mini" onClick={onSwitch} aria-label="Сменить игрока">
          <Emoji code={profile.avatar} size={48} />
        </button>
        <span className="map-name">{profile.name || 'Привет!'}</span>
        <button className="btn album-btn" onClick={onAlbum} aria-label={`Альбом наклеек: ${stickers.length}`}>
          <Icon name="star" size={32} /> {stickers.length}
        </button>
      </header>

      <section className="today" aria-label="Сегодня">
        <Guide pose="idle" size={112} className="today-guide" />
        {suggestions.map((s) => {
          const m = getMission(s.id)!;
          return (
            <button key={s.id} className={`today-card ${s.reason}`} onClick={() => start(s.id)}>
              <Emoji code={missionArt(m)} size={88} />
              <span className="today-text">
                <span className="today-title">{m.title}</span>
                <span className="today-reason">{s.reason === 'review' && <Icon name="review" size={18} />}{REASON[s.reason]}</span>
              </span>
            </button>
          );
        })}
      </section>

      {ISLANDS.map((isl, index) => {
        const islOpen = islandOpen(own, index, start0);
        const bg = bgVars(isl.id === 'count' ? 'map' : `map-${isl.id}`);
        // На нарисованной карте камни стоят на площадках; без рисунка идут змейкой по цветному острову.
        const stops = bg ? MAP_STOPS[isl.id] ?? snakeStops(isl.missions) : snakeStops(isl.missions);
        const onMap = new Set(stops.map((s) => s.id));
        const extra = isl.missions.filter((id) => !onMap.has(id));
        const emblem = customArt(`ui/island-${isl.id}`);
        return (
          <section
            key={isl.id}
            className={`island ${islOpen ? '' : 'locked'}`}
            data-island={isl.id}
            aria-label={isl.title}
          >
            <h2>
              {emblem && <img src={emblem} width={40} height={40} alt="" className="island-emblem" />}
              {!islOpen && <Icon name="lock" size={28} />}
              {isl.title}
            </h2>
            <LazyMap className={`island-map ${bg ? 'drawn' : 'plain'}`} bg={bg}>
              {stops.map((st) => stone(st.id, st))}
            </LazyMap>
            {extra.length > 0 && (
              <div className="island-extra">
                <h3>Ещё задания</h3>
                <ol className="path">{extra.map((id) => stone(id))}</ol>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/**
 * Карта острова грузит свой рисунок, только когда подходит к экрану:
 * на слабом телефоне первый экран не ждёт картинок всех шести островов.
 */
function LazyMap({ className, bg, children }: { className: string; bg?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setNear(true); }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return <ol ref={ref} className={className} style={near ? bg : undefined}>{children}</ol>;
}
