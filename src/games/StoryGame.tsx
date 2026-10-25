import { useState } from 'react';
import { PHRASE } from '../audio/phrases';
import type { CardParams } from '../content/missions';
import { storyArt } from '../ui/art';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'story' }>;

/** Сначала выбрать действие, потом найти ответ: так видно, где именно ошибка. */
export function StoryGame({ params, locked, onSubmit }: GameProps<P>) {
  const [step, setStep] = useState<'op' | 'answer'>('op');
  const art = storyArt(params.text);
  return (
    <div className="game">
      {art && <img className="story-art" src={art} alt="" width={280} height={210} />}
      {step === 'op' ? (
        <>
          <div className="question">Какое действие подходит?</div>
          <Choices
            options={params.ops}
            render={(o) => <span className="choice-text expr">{o}</span>}
            disabled={locked}
            onPick={(o) => {
              const correct = o === params.ops[params.op];
              onSubmit({ correct, answer: o, final: false, next: PHRASE.nextResult });
              if (correct) setStep('answer');
            }}
          />
        </>
      ) : (
        <>
          <div className="question">{params.ops[params.op]} = ?</div>
          <Choices
            options={answerChoices(params.answer, 0)}
            render={(n) => <NumberTile n={n} dots={false} />}
            disabled={locked}
            onPick={(n) => onSubmit({ correct: n === params.answer, answer: `итог ${n}` })}
          />
        </>
      )}
    </div>
  );
}
