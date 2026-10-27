import { lazy, Suspense, useEffect, useReducer, type CSSProperties } from 'react';
import { customArt } from '../content/art';
import { CHARACTER_IDLE, characterStep, poseOf, type CharacterState } from './character';
import { onGameEvent, type GameEvent } from './events';

const POSES = ['idle', 'talk', 'help', 'happy', 'think'] as const;

function useCharacter(): CharacterState {
  const [s, dispatch] = useReducer((st: CharacterState, e: GameEvent) => characterStep(st, e, Date.now()), CHARACTER_IDLE);
  useEffect(() => onGameEvent(dispatch), []);
  useEffect(() => {
    // Ход времени раз в полсекунды, только пока экран виден: в свёрнутом приложении Счётик не тратит заряд.
    const t = setInterval(() => { if (!document.hidden) dispatch({ type: 'TICK' }); }, 500);
    return () => clearInterval(t);
  }, []);
  return s;
}

/** Векторный риг (motion/rig) — отдельный чанк; пока он грузится, стоят нарисованные позы. */
const SchetikRig = lazy(() => import('./rig/SchetikRig'));

/**
 * Счётик, который слушает события игры (motion/events). Основной вид — векторный риг на GSAP:
 * моргает, смотрит, говорит ртом под голос, машет, указывает, радуется (docs/MOTION_SYSTEM.md).
 * Пять растровых поз — запасной вид, пока риг не загрузился.
 */
export function Schetik({ size = 96, className = '' }: { size?: number; className?: string }) {
  const { mood, voice } = useCharacter();
  const pose = poseOf(mood);
  const srcs = POSES.map((p) => customArt(`char/guide-${p}`));
  const poses = srcs.every(Boolean) && (
    <div className="schetik-body">
      {POSES.map((p, i) => (
        <img key={p} src={srcs[i]!} width={size} height={size} alt="" draggable={false} className={p === pose ? 'on' : ''} />
      ))}
    </div>
  );
  return (
    // Размер — переменная: правила экрана (--sch в styles.css) могут уменьшить Счётика на узком телефоне.
    <div className={`schetik ${className}`} data-mood={mood} style={{ '--sch-default': `${size}px` } as CSSProperties} aria-hidden="true">
      <Suspense fallback={poses}>
        <SchetikRig mood={mood} voice={voice} />
      </Suspense>
      {mood === 'sleeping' && <span className="schetik-z">z</span>}
    </div>
  );
}
