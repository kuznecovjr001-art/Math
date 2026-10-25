import { expectedAnswer, type CardParams } from '../content/missions';
import { tenChoices } from '../content/numbers';
import { NumberChoices } from './NumberChoices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'openLine' }>;

/** Открытая числовая прямая: от a прыгаем десятками, потом единицами. Прыжки рисуются с подсказкой. */
export function OpenLineGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  const tens = Math.floor(params.b / 10);
  const ones = params.b % 10;
  const W = 640;
  const span = params.b;
  const x = (v: number) => 40 + ((v - params.a) / span) * (W - 80);
  const stops = [params.a, ...Array.from({ length: tens }, (_, k) => params.a + (k + 1) * 10)];
  const jumps: [number, number, string][] = [];
  if (help >= 2) stops.slice(1).forEach((v, k) => jumps.push([stops[k], v, '+10']));
  if (help >= 3 && ones > 0) jumps.push([stops[stops.length - 1], answer, `+${ones}`]);
  return (
    <div className="game">
      <div className="more-scene line-wrap">
        <svg viewBox={`0 0 ${W} 160`} className="numline" role="img" aria-label={`Открытая числовая прямая от ${params.a}`}>
          <line x1={20} y1={120} x2={W - 20} y2={120} className="nl-axis" />
          <line x1={x(params.a)} y1={106} x2={x(params.a)} y2={134} className="nl-tick" />
          <text x={x(params.a)} y={154} className="nl-num">{params.a}</text>
          <text x={W / 2} y={30} className="nl-plus">+ {params.b}</text>
          {jumps.map(([a, b, t], k) => (
            <g key={k}>
              <path d={`M${x(a)} 114 Q${(x(a) + x(b)) / 2} 50 ${x(b)} 114`} className={`nl-arc ${t === '+10' ? '' : 'ones'}`} />
              <text x={(x(a) + x(b)) / 2} y={72} className="nl-step">{t}</text>
              <line x1={x(b)} y1={110} x2={x(b)} y2={130} className="nl-tick" />
              <text x={x(b)} y={154} className="nl-num">{b}</text>
            </g>
          ))}
        </svg>
      </div>
      <NumberChoices options={tenChoices(answer, 1, 100)} answer={answer} locked={locked} onSubmit={onSubmit} />
    </div>
  );
}
