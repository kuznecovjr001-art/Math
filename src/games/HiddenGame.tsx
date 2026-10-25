import { ITEMS, type CardParams } from '../content/missions';
import { Emoji, Plate } from '../ui/art';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'hidden' }>;

export function HiddenGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const item = ITEMS[params.item];
  const hidden = params.total - params.visible;
  return (
    <div className="game">
      <div className="hidden-scene">
        <div className="plate-wrap">
          <Plate size={170} />
          <div className="plate-items">
            {Array.from({ length: params.visible }, (_, i) => <Emoji key={i} code={item.img} size={44} />)}
          </div>
        </div>
        <div className="plate-wrap">
          <Plate size={170} />
          <div className="napkin" role="img" aria-label="Салфетка">?</div>
        </div>
      </div>
      {help >= 2 && (
        <div className="slots-row" role="group" aria-label={`Всего ${params.total}`}>
          {Array.from({ length: params.total }, (_, i) =>
            i < params.visible
              ? <Emoji key={i} code={item.img} size={36} />
              : <span key={i} className="slot small">{help >= 3 ? i + 1 : ''}</span>,
          )}
        </div>
      )}
      <Choices
        options={answerChoices(hidden, 0)}
        render={(n) => <NumberTile n={n} />}
        disabled={locked}
        onPick={(n) => onSubmit({ correct: n === hidden, answer: String(n) })}
      />
    </div>
  );
}
