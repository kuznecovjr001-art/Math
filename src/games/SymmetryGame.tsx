import { useState } from 'react';
import { expectedAnswer, type CardParams } from '../content/missions';
import { mirror, symmetryOptions } from '../content/numbers';
import { Choices } from './Choices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'symmetry' }>;

function Half({ rows, ghost }: { rows: string[]; ghost?: string[] }) {
  return (
    <span className="sym-half">
      {rows.flatMap((r, y) => [...r].map((c, x) => (
        <i key={`${y}-${x}`} className={c === '1' ? 'on' : ghost?.[y]?.[x] === '1' ? 'ghost' : ''} />
      )))}
    </span>
  );
}

/**
 * Половина узора и линия симметрии. Нужно выбрать отражение, а не копию.
 * После верного ответа левая половина «перекидывается» через линию, как крыло бабочки.
 */
export function SymmetryGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, setSolved] = useState(false);
  const answer = expectedAnswer(params);
  const opts = symmetryOptions(params);
  const right = mirror(params.half);
  // Подсказка: первая строка отражения, затем бледный контур всего отражения.
  const preview = help >= 3 ? right : help >= 2 ? [right[0], '000', '000', '000'] : ['000', '000', '000', '000'];
  return (
    <div className="game">
      <div className="more-scene sym-scene" role="img" aria-label="Половина узора и пустая половина за линией">
        <Half rows={params.half} />
        <span className="sym-axis" />
        {solved
          ? <span className="sym-flip"><Half rows={right} /></span>
          : <Half rows={['000', '000', '000', '000']} ghost={preview} />}
      </div>
      <Choices
        options={opts.map((_, i) => i)}
        render={(i) => <Half rows={opts[i]} />}
        label={(i) => `Вариант ${i + 1}`}
        disabled={locked}
        onPick={(i) => {
          if (i === answer) setSolved(true);
          onSubmit({ correct: i === answer, answer: String(i), showMs: i === answer ? 1100 : undefined });
        }}
      />
    </div>
  );
}
