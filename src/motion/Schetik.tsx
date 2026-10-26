import { useEffect, useReducer } from 'react';
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

/**
 * Счётик, который слушает события игры (motion/events). Пять нарисованных поз сменяются плавно,
 * а состояние добавляет небольшое движение всей фигуры (дыхание, прыжок радости, наклон в раздумье).
 * Настоящих движений лап, глаз и рта нет: нужны отдельные слои — docs/MOTION_SYSTEM.md, «ТЗ на слои».
 */
export function Schetik({ size = 96, className = '' }: { size?: number; className?: string }) {
  const { mood } = useCharacter();
  const pose = poseOf(mood);
  const srcs = POSES.map((p) => customArt(`char/guide-${p}`));
  if (!srcs.every(Boolean)) return null;
  return (
    <div className={`schetik ${className}`} data-mood={mood} style={{ width: size, height: size }} aria-hidden="true">
      <div className="schetik-body">
        {POSES.map((p, i) => (
          <img key={p} src={srcs[i]!} width={size} height={size} alt="" draggable={false} className={p === pose ? 'on' : ''} />
        ))}
      </div>
      {mood === 'sleeping' && <span className="schetik-z">z</span>}
    </div>
  );
}
