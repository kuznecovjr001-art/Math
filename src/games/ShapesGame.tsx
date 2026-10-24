import { SHAPE_NAMES, type CardParams, type Shape } from '../content/missions';
import { Choices } from './Choices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'shapes' }>;

/** Вершины фигур в квадрате 100×100; круг и овал рисуются отдельно. */
const POINTS: Partial<Record<Shape, [number, number][]>> = {
  square: [[20, 20], [80, 20], [80, 80], [20, 80]],
  rectangle: [[8, 30], [92, 30], [92, 70], [8, 70]],
  triangle: [[50, 12], [90, 84], [10, 84]],
  pentagon: [[50, 10], [90, 40], [75, 88], [25, 88], [10, 40]],
};

export function ShapeSvg({ shape, size, turn = 0, corners = false, color = '#ffd166' }: {
  shape: Shape; size: number; turn?: number; corners?: boolean; color?: string;
}) {
  const pts = POINTS[shape];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={SHAPE_NAMES[shape]}>
      <g transform={`rotate(${turn} 50 50)`}>
        {shape === 'circle' && <circle cx="50" cy="50" r="38" fill={color} stroke="#3d2c00" strokeWidth="4" />}
        {shape === 'oval' && <ellipse cx="50" cy="50" rx="44" ry="26" fill={color} stroke="#3d2c00" strokeWidth="4" />}
        {pts && (
          <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={color} stroke="#3d2c00" strokeWidth="4" strokeLinejoin="round" />
        )}
        {corners && pts?.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill="#e76f51" />)}
      </g>
    </svg>
  );
}

const COLORS = ['#8ecae6', '#ffb4a2', '#b5e48c'];

export function ShapesGame({ params, help, locked, onSubmit }: GameProps<P>) {
  return (
    <div className="game">
      <div className="shape-target">
        <ShapeSvg shape={params.target} size={130} corners={help >= 2} />
      </div>
      <Choices<Shape>
        options={params.options}
        render={(s) => (
          <ShapeSvg
            shape={s}
            size={s === params.target ? 84 : 100}
            turn={s === params.target ? params.turn : 15}
            corners={help >= 2}
            color={COLORS[params.options.indexOf(s) % COLORS.length]}
          />
        )}
        label={(s) => SHAPE_NAMES[s]}
        disabled={locked}
        onPick={(s) => onSubmit({ correct: s === params.target, answer: SHAPE_NAMES[s] })}
      />
    </div>
  );
}
