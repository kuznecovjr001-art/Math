import { useState } from 'react';
import { ITEMS, type CardParams } from '../content/missions';
import { Emoji, Plate } from '../ui/art';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'hidden' }>;

/** После верного ответа салфетка приподнимается: под ней ровно столько, сколько ребёнок назвал. */
export function HiddenGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, setSolved] = useState(false);
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
          {solved && (
            <div className="plate-items under-napkin">
              {Array.from({ length: hidden }, (_, i) => <Emoji key={i} code={item.img} size={44} />)}
            </div>
          )}
          <div className={`napkin ${solved ? 'lifted' : ''}`} role="img" aria-label="Салфетка">{solved ? '' : '?'}</div>
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
        options={answerChoices(hidden, 1).filter((n) => n < params.total)}
        render={(n) => <NumberTile n={n} />}
        disabled={locked}
        onPick={(n) => {
          if (n === hidden) setSolved(true);
          onSubmit({ correct: n === hidden, answer: String(n), showMs: n === hidden ? 1300 : undefined });
        }}
      />
    </div>
  );
}
