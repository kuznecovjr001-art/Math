import type { CSSProperties } from 'react';
import { expectedAnswer, type CardParams } from '../content/missions';
import { Emoji } from '../ui/art';
import { NumberChoices } from './NumberChoices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'jumps' }>;

/** Варианты: верный, на прыжок меньше и на прыжок больше. */
export function jumpChoices(step: number, count: number): number[] {
  const right = step * count;
  const all = [right - step, right, right + step];
  const k = count % 3;
  return all.slice(k).concat(all.slice(0, k));
}

/** Числовая прямая от нуля; лягушка прыгает по step. Дуги прыжков появляются с подсказкой. */
export function JumpsGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  const max = Math.max(20, Math.ceil((answer + params.step) / 5) * 5);
  const W = 640;
  const x = (v: number) => 20 + (v / max) * (W - 40);
  const label = (v: number) => v % 5 === 0;
  return (
    <div className="game">
      <div className="more-scene line-wrap">
        <svg viewBox={`0 0 ${W} 160`} className="numline" role="img" aria-label={`Числовая прямая от 0 до ${max}`}>
          <line x1={10} y1={110} x2={W - 10} y2={110} className="nl-axis" />
          {Array.from({ length: max + 1 }, (_, v) => (
            <g key={v}>
              <line x1={x(v)} y1={label(v) ? 98 : 104} x2={x(v)} y2={116} className="nl-tick" />
              {label(v) && <text x={x(v)} y={150} className="nl-num">{v}</text>}
            </g>
          ))}
          {help >= 2 && Array.from({ length: params.count }, (_, k) => {
            const a = x(k * params.step), b = x((k + 1) * params.step);
            return (
              <g key={k} className="nl-hop" style={{ '--k': k } as CSSProperties}>
                <path d={`M${a} 104 Q${(a + b) / 2} ${104 - 70} ${b} 104`} className="nl-arc" pathLength={1} />
                {help >= 3 && <text x={b} y={62} className="nl-land">{(k + 1) * params.step}</text>}
              </g>
            );
          })}
        </svg>
        {/* На разобранном примере лягушка прыгает по дугам: шаги видны по одному. До подсказки стоит на нуле. */}
        <span className="frog-track" style={help >= 3 ? ({ '--to': `${((x(answer) - x(0)) / W) * 100}%`, '--n': params.count } as CSSProperties) : undefined}>
          <span className={`frog ${help >= 3 ? 'hopping' : ''}`} style={{ left: `${(x(0) / W) * 100}%` }}><Emoji code="1F438" size={44} label="лягушка" /></span>
        </span>
      </div>
      <NumberChoices options={jumpChoices(params.step, params.count)} answer={answer} locked={locked} onSubmit={onSubmit} />
    </div>
  );
}
