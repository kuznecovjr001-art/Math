import type { CardParams } from '../content/missions';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'zero' }>;

/** Рубашка: оторвавшиеся пуговицы лежат внизу; ответ может быть нулём. */
export function ZeroGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const left = params.start - params.lose;
  return (
    <div className="game">
      <div className="shirt-scene">
        <div className="shirt" aria-label="Рубашка">
          {Array.from({ length: params.start }, (_, i) => (
            <span key={i} className={`shirt-button ${i >= left ? 'lost' : ''}`} />
          ))}
        </div>
        <div className="floor-buttons" aria-label={`Оторвались: ${params.lose}`}>
          {Array.from({ length: params.lose }, (_, i) => (
            <span key={i} className={`shirt-button fallen ${help >= 2 ? 'crossed' : ''}`} style={{ animationDelay: `${0.3 + i * 0.35}s` }} />
          ))}
        </div>
      </div>
      {help >= 3 && <div className="sum-hint">{params.start} − {params.lose} = ?</div>}
      <Choices
        options={answerChoices(left, 0)}
        render={(n) => <NumberTile n={n} dots={false} />}
        disabled={locked}
        onPick={(n) => onSubmit({ correct: n === left, answer: String(n) })}
      />
    </div>
  );
}
