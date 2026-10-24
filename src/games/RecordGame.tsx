import { useState } from 'react';
import { ITEMS, type CardParams } from '../content/missions';
import { Emoji } from '../ui/art';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'record' }>;

/** Запись «по per, groups раз» и две частые ошибки: сложить числа и взять лишнюю группу. */
export function recordChoices(per: number, groups: number): string[] {
  const all = [`${per} × ${groups}`, `${per} + ${groups}`, `${per} × ${groups + 1}`];
  const shift = (per + groups) % 3;
  return all.slice(shift).concat(all.slice(0, shift));
}

export function RecordGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [step, setStep] = useState<'record' | 'total'>('record');
  const item = ITEMS[params.item];
  const right = `${params.per} × ${params.groups}`;
  const total = params.per * params.groups;
  return (
    <div className="game">
      <div className="groups">
        {Array.from({ length: params.groups }, (_, i) => (
          <div key={i} className="group box static-group">
            <div className="group-items">
              {Array.from({ length: params.per }, (_, k) => <Emoji key={k} code={item.img} size={40} />)}
            </div>
            {help >= 3 && <span className="badge static">{params.per}</span>}
          </div>
        ))}
      </div>
      {help >= 2 && <div className="sum-hint">{Array(params.groups).fill(params.per).join(' + ')}</div>}
      {step === 'record' ? (
        <Choices
          options={recordChoices(params.per, params.groups)}
          render={(r) => <span className="choice-text expr">{r}</span>}
          disabled={locked}
          onPick={(r) => {
            const correct = r === right;
            onSubmit({ correct, answer: r, final: false, next: 'Верно! А сколько всего?' });
            if (correct) setStep('total');
          }}
        />
      ) : (
        <>
          <div className="question">{right} = ?</div>
          <Choices
            options={answerChoices(total)}
            render={(n) => <NumberTile n={n} dots={false} />}
            disabled={locked}
            onPick={(n) => onSubmit({ correct: n === total, answer: `итог ${n}` })}
          />
        </>
      )}
    </div>
  );
}
