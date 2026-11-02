import { useState, type CSSProperties } from 'react';
import { expectedAnswer, type CardParams } from '../content/missions';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'tenframe' }>;

/** Рамка 2×5. cells: цвет каждой из десяти клеток или null. */
function Frame({ cells, mark }: { cells: (string | null)[]; mark: boolean }) {
  return (
    <div className="tenframe">
      {cells.map((c, i) => (
        <span key={i} className={`tf-cell ${!c && mark ? 'attention' : ''}`}>
          {/* Фишки ложатся по одной, по порядку клеток: рамка заполняется так же, как ребёнок считает. */}
          {c && <i className={`counter ${c}`} style={{ '--i': i } as CSSProperties} />}
        </span>
      ))}
    </div>
  );
}

/**
 * Десяток в рамке. После верного ответа рамка показывает, почему так: пустые клетки заполняются
 * (сколько не хватает до 10), а при сложении синие фишки переходят в первую рамку до полного десятка.
 */
export function TenFrameGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, setSolved] = useState(false);
  const answer = expectedAnswer(params);
  const fill = params.b === 0;
  // Ступень 2 для сложения: часть второго числа переносим, чтобы дополнить десяток.
  const move = !fill && (help >= 2 || solved) ? Math.min(10 - params.a, params.b) : 0;
  const first = Array.from({ length: 10 }, (_, i) =>
    i < params.a ? 'red' : i < params.a + move || (fill && solved) ? 'blue' : null);
  const secondCount = params.b - move;
  const second = Array.from({ length: 10 }, (_, i) => (i < secondCount ? 'blue' : null));

  return (
    <div className="game">
      <div className="frames">
        <Frame cells={first} mark={fill && help >= 2} />
        {!fill && <Frame cells={second} mark={false} />}
      </div>
      {!fill && (help >= 3 || solved) && (
        <div className="sum-hint">
          {params.a} + {params.b} = {params.a} + {10 - params.a} + {params.b - (10 - params.a)} = 10 + {params.b - (10 - params.a)}
        </div>
      )}
      {fill && help >= 3 && <div className="sum-hint">10 = {params.a} + ?</div>}
      <Choices
        options={answerChoices(answer, 0)}
        render={(n) => <NumberTile n={n} dots={fill} />}
        disabled={locked}
        onPick={(n) => {
          if (n === answer) setSolved(true);
          onSubmit({ correct: n === answer, answer: String(n), showMs: n === answer ? 1400 : undefined });
        }}
      />
    </div>
  );
}
