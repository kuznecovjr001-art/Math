import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { PHRASE } from '../audio/phrases';
import { speak } from '../audio/voice';
import { ISLANDS, islandOpen, missionOpen } from '../content/levels';
import { customArt, missionArt } from '../content/art';
import { MAP_STOPS, snakeStops, type Stop } from '../content/mapLayout';
import { getMission } from '../content/missions';
import { todaySuggestions } from '../content/plan';
import { isReviewDue, missionDone } from '../engine/progress';
import type { Attempt, MissionSession, Profile } from '../engine/types';
import { MapLife } from '../motion/MapLife';
import { Schetik } from '../motion/Schetik';
import { bgVars, Emoji, Icon, SceneBg } from '../ui/art';
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

/** Что было открыто и пройдено при прошлом показе карты (в этой сессии): новое появляется плавно один раз. */
const lastSeen = new Map<string, { open: Set<string>; done: Set<string> }>();
/**
 * Где ребёнок был на карте: вернувшись из задания или альбома, он видит свой остров, а не начало карты.
 * Запоминаем остров у верха экрана и его отступ, а не scrollY: блок «Сегодня» над островами мог смениться.
 */
const lastSpot = new Map<string, { island: string; top: number }>();

export function MapScreen({ profile, attempts, sessions, stickers, now, onStart, onAlbum, onSwitch }: Props) {
  const own = attempts.filter((a) => a.profileId === profile.id);
  const start0 = profile.startIsland ?? 0;
  const isOpen = (id: string) => missionOpen(own, getMission(id)!, start0);
  const suggestions = todaySuggestions(profile, own, sessions.filter((s) => s.profileId === profile.id), stickers, now);

  useEffect(() => {
    speak(suggestions.length > 1 ? PHRASE.pick : PHRASE.tap);
    // Озвучиваем только при входе на карту.
  }, []);

  // До отрисовки: новый кадр (и снимок плавной смены экрана) сразу на прежнем месте, без прыжка.
  useLayoutEffect(() => {
    const spot = lastSpot.get(profile.id);
    const el = spot && document.querySelector(`.island[data-island="${spot.island}"]`);
    window.scrollTo(0, el ? window.scrollY + el.getBoundingClientRect().top - spot.top : 0);
  }, []);
  const leave = (go: () => void) => {
    const el = [...document.querySelectorAll<HTMLElement>('.island')].find((e) => e.getBoundingClientRect().bottom > 0);
    if (el && window.scrollY > 0) lastSpot.set(profile.id, { island: el.dataset.island!, top: el.getBoundingClientRect().top });
    else lastSpot.delete(profile.id);
    go();
  };
  const start = (id: string) => leave(() => onStart(id, isReviewDue(own, id, now) ? 'review' : 'play'));

  const ids = ISLANDS.flatMap((i) => i.missions);
  const [fresh] = useState(() => {
    const open = new Set(ids.filter(isOpen));
    const done = new Set(ids.filter((id) => missionDone(own, stickers, id)));
    const prev = lastSeen.get(profile.id);
    lastSeen.set(profile.id, { open, done });
    return {
      opened: new Set(prev ? [...open].filter((id) => !prev.open.has(id)) : []),
      done: new Set(prev ? [...done].filter((id) => !prev.done.has(id)) : []),
    };
  });

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
      <li
        key={id}
        className={`stone ${open ? 'open' : 'locked'} ${done ? 'done' : ''} ${at ? 'on-map' : ''} ${fresh.opened.has(id) ? 'just-opened' : ''} ${fresh.done.has(id) ? 'just-done' : ''}`}
        style={pos}
      >
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
      <div className="map-clouds" aria-hidden="true"><span /><span /></div>
      <header className="map-bar">
        <button className="tap avatar mini" onClick={onSwitch} aria-label="Сменить игрока">
          <Emoji code={profile.avatar} size={48} />
        </button>
        <h1 className="sr-only">Карта островов</h1>
        <span className="map-name">{profile.name || 'Привет!'}</span>
        <button className="btn album-btn" onClick={() => leave(onAlbum)} aria-label={`Альбом наклеек: ${stickers.length}`}>
          <Icon name="star" size={32} /> {stickers.length}
        </button>
      </header>

      <section className="today" aria-label="Сегодня">
        <Schetik size={112} className="today-guide" />
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
              {bg && <MapLife island={isl.id} />}
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
 * Пока карта видна, у неё есть data-live — только тогда двигается её живой слой (MapLife).
 */
function LazyMap({ className, bg, children }: { className: string; bg?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined');
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => {
      const e = es[es.length - 1];
      if (e.isIntersecting) setNear(true);
      setLive(e.intersectionRatio > 0);
    }, { rootMargin: '400px', threshold: [0, 0.01] });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <ol ref={ref} className={className} style={near ? bg : undefined} data-live={live || undefined}>{children}</ol>;
}
