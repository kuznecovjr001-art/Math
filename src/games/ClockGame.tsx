import { expectedAnswer, type CardParams } from '../content/missions';
import { customArt } from '../content/art';
import { clockChoices } from '../content/numbers';
import { Choices } from './Choices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'clock' }>;

/** Циферблат: короткая стрелка — часы, длинная — минуты. С подсказкой стрелки подписаны цветом. */
export function ClockFace({ h, m, help }: { h: number; m: number; help: number }) {
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle = m * 6;
  const hand = (angle: number, len: number) => {
    const r = (angle - 90) * (Math.PI / 180);
    return [100 + Math.cos(r) * len, 100 + Math.sin(r) * len];
  };
  const [hx, hy] = hand(hourAngle, 48);
  const [mx, my] = hand(minAngle, 72);
  const face = customArt('item/clock-face');
  return (
    <svg viewBox="0 0 200 200" width={220} height={220} role="img" aria-label="Часы">
      {face ? <image href={face} x={4} y={4} width={192} height={192} /> : <circle cx={100} cy={100} r={94} className="clock-face" />}
      {help >= 3 && m === 30 && <path d="M100 100 L100 14 A86 86 0 0 1 100 186 Z" className="clock-half" />}
      {Array.from({ length: 12 }, (_, i) => {
        const [x, y] = hand((i + 1) * 30, 76);
        return <text key={i} x={x} y={y + 7} className="clock-num">{i + 1}</text>;
      })}
      <line x1={100} y1={100} x2={mx} y2={my} className={`clock-min ${help >= 2 ? 'hint' : ''}`} />
      <line x1={100} y1={100} x2={hx} y2={hy} className={`clock-hour ${help >= 2 ? 'hint' : ''}`} />
      <circle cx={100} cy={100} r={6} className="clock-pin" />
    </svg>
  );
}

export function ClockGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  const opts = clockChoices(params);
  return (
    <div className="game">
      <div className="more-scene clock-scene">
        <ClockFace h={params.h} m={params.m} help={help} />
        {help >= 2 && <div className="clock-legend"><span className="hour">короткая — часы</span><span className="min">длинная — минуты</span></div>}
      </div>
      <Choices
        options={opts.map((_, i) => i)}
        render={(i) => <span className="clock-text">{opts[i]}</span>}
        disabled={locked}
        onPick={(i) => onSubmit({ correct: i === answer, answer: opts[i] })}
      />
    </div>
  );
}
