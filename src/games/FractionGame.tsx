import { expectedAnswer, type CardParams } from '../content/missions';
import type { FracShape } from '../content/numbers';
import { Choices } from './Choices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'fraction' }>;

/** Части фигуры прямоугольниками в квадрате 100×100; круг обрезает их по контуру. Неравные части — сдвинутый разрез. */
export function fractionParts(f: FracShape): [number, number, number, number][] {
  if (f.parts === 2) {
    const s = f.equal ? 50 : 74;
    return [[0, 0, s, 100], [s, 0, 100 - s, 100]];
  }
  const [sx, sy] = f.equal ? [50, 50] : [70, 30];
  // По часовой стрелке от левого верхнего угла.
  return [[0, 0, sx, sy], [sx, 0, 100 - sx, sy], [sx, sy, 100 - sx, 100 - sy], [0, sy, sx, 100 - sy]];
}

function FracPicture({ f, id }: { f: FracShape; id: string }) {
  const clip = `frac-${id}`;
  return (
    <svg viewBox="-4 -4 108 108" width={110} height={110} aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          {f.shape === 'circle' ? <circle cx={50} cy={50} r={50} /> : <rect x={0} y={10} width={100} height={80} rx={6} />}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {fractionParts(f).map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} className={i < f.shaded ? 'frac-on' : 'frac-off'} />
        ))}
      </g>
      {f.shape === 'circle'
        ? <circle cx={50} cy={50} r={50} className="frac-edge" />
        : <rect x={0} y={10} width={100} height={80} rx={6} className="frac-edge" />}
    </svg>
  );
}

/** Где закрашена половина, четверть или три четверти. Подсказка приглушает фигуры с неравными частями. */
export function FractionGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  return (
    <div className="game">
      <Choices
        options={params.options.map((_, i) => i)}
        render={(i) => (
          <span className={`frac-opt ${help >= 2 && !params.options[i].equal ? 'dim' : ''}`}>
            <FracPicture f={params.options[i]} id={`${i}`} />
            {help >= 3 && <span className="frac-label">{params.options[i].shaded} из {params.options[i].parts}</span>}
          </span>
        )}
        label={(i) => `Фигура ${i + 1}`}
        disabled={locked}
        onPick={(i) => onSubmit({ correct: i === answer, answer: String(i) })}
      />
    </div>
  );
}
