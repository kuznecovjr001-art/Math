import { ITEMS, type CardParams } from '../content/missions';
import { Emoji } from '../ui/art';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'count' }>;

/** Неровная, но всегда одинаковая раскладка: количество не угадывается по форме ряда. */
export function scatter(n: number, seed: number): { x: number; y: number }[] {
  const cols = Math.ceil(Math.sqrt(n * 1.6));
  return Array.from({ length: n }, (_, i) => {
    const r = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
    const jitter = r - Math.floor(r);
    const col = i % cols;
    const row = Math.floor(i / cols);
    return { x: (col + 0.5 + (jitter - 0.5) * 0.5) / cols, y: row + (jitter - 0.5) * 0.4 };
  });
}

export function CountGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const item = ITEMS[params.item];
  const pos = scatter(params.n, params.n);
  const rows = Math.max(...pos.map((p) => Math.ceil(p.y + 1)));
  return (
    <div className="game">
      <div className="scatter" style={{ height: rows * 92 + 24 }}>
        {pos.map((p, i) => (
          <span key={i} className="scatter-item" style={{ left: `${p.x * 100}%`, top: p.y * 92 + 12 }}>
            <Emoji code={item.img} size={68} />
            {help >= 2 && <span className="badge">{i + 1}</span>}
          </span>
        ))}
      </div>
      <Choices
        options={answerChoices(params.n)}
        render={(n) => <NumberTile n={n} dots={false} />}
        disabled={locked}
        onPick={(n) => onSubmit({ correct: n === params.n, answer: String(n) })}
      />
    </div>
  );
}
