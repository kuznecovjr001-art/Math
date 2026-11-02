import { expectedAnswer, type CardParams } from '../content/missions';
import { clockChoices } from '../content/numbers';
import { Choices } from './Choices';
import { useSolved, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'clock' }>;

/** Циферблат: короткая стрелка — часы, длинная — минуты. С подсказкой стрелки подписаны цветом. */
export function ClockFace({ h, m, help }: { h: number; m: number; help: number }) {
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle = m * 6;
  const hand = (angle: number, len: number) => {
    const r = (angle - 90) * (Math.PI / 180);
    return [100 + Math.cos(r) * len, 100 + Math.sin(r) * len];
  };
  return (
    <svg viewBox="0 0 200 200" width={220} height={220} role="img" aria-label="Часы">
      {/* Свой векторный циферблат: на рисунке item/clock-face цифры свои и кривые, вместе с нашими они слипались. */}
      <circle cx={100} cy={100} r={94} className="clock-face" />
      {Array.from({ length: 60 }, (_, i) => {
        const [x1, y1] = hand(i * 6, i % 5 ? 88 : 84);
        const [x2, y2] = hand(i * 6, 91);
        return <line key={`t${i}`} x1={x1} y1={y1} x2={x2} y2={y2} className={i % 5 ? 'clock-tick' : 'clock-tick big'} />;
      })}
      {help >= 3 && m === 30 && <path d="M100 100 L100 14 A86 86 0 0 1 100 186 Z" className="clock-half" />}
      {Array.from({ length: 12 }, (_, i) => {
        const [x, y] = hand((i + 1) * 30, 68);
        return <text key={i} x={x} y={y + 7} className="clock-num">{i + 1}</text>;
      })}
      {/* Стрелки нарисованы на 12 и повёрнуты вокруг центра: при появлении они идут от 12 к нужному времени по часовой. */}
      <line x1={100} y1={100} x2={100} y2={28} className={`clock-min clock-hand ${help >= 2 ? 'hint' : ''}`} style={{ transform: `rotate(${minAngle}deg)` }} />
      <line x1={100} y1={100} x2={100} y2={52} className={`clock-hour clock-hand ${help >= 2 ? 'hint' : ''}`} style={{ transform: `rotate(${hourAngle}deg)` }} />
      <circle cx={100} cy={100} r={6} className="clock-pin" />
    </svg>
  );
}

export function ClockGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, submit] = useSolved(onSubmit);
  const answer = expectedAnswer(params);
  const opts = clockChoices(params);
  return (
    <div className="game">
      <div className="more-scene clock-scene">
        <ClockFace h={params.h} m={params.m} help={solved ? 3 : help} />
        {help >= 2 && <div className="clock-legend"><span className="hour">короткая — часы</span><span className="min">длинная — минуты</span></div>}
      </div>
      <Choices
        options={opts.map((_, i) => i)}
        render={(i) => <span className="clock-text">{opts[i]}</span>}
        disabled={locked}
        onPick={(i) => submit({ correct: i === answer, answer: opts[i] })}
      />
    </div>
  );
}
