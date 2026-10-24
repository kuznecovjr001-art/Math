import { useState } from 'react';
import { sfx } from '../audio/sfx';
import { expectedAnswer, FRUITS, type CardParams } from '../content/missions';
import { Emoji } from '../ui/art';
import { NumberTile } from '../ui/NumberTile';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'boxes' }>;

export function BoxesGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [inGroup, setInGroup] = useState<number[]>(() => Array(params.groups).fill(0));
  const [step, setStep] = useState<'arrange' | 'total'>('arrange');
  const fruit = FRUITS[params.fruit];
  const used = inGroup.reduce((s, x) => s + x, 0);
  const stock = params.stock - used;
  const total = expectedAnswer(params);
  const arranging = step === 'arrange';

  const add = (i: number) => {
    if (locked || !arranging || stock <= 0) return;
    sfx.pop();
    setInGroup((g) => g.map((x, j) => (j === i ? x + 1 : x)));
  };
  const remove = (i: number) => {
    if (locked || !arranging || inGroup[i] === 0) return;
    sfx.back();
    setInGroup((g) => g.map((x, j) => (j === i ? x - 1 : x)));
  };

  const checkArrangement = () => {
    const correct = inGroup.every((n) => n === params.per);
    onSubmit({ correct, answer: `раскладка ${inGroup.join(',')}`, final: false });
    if (correct) setStep('total');
  };

  return (
    <div className="game">
      {arranging && (
        <div className="stock wide">
          {Array.from({ length: stock }, (_, i) => <Emoji key={i} code={fruit.img} size={52} />)}
          {stock === 0 && <span className="stock-empty">Запас закончился</span>}
        </div>
      )}
      <div className="groups">
        {inGroup.map((n, i) => (
          <div key={i} className={`group ${params.holder} ${help >= 2 && arranging && n !== params.per ? 'attention' : ''}`}>
            <button
              className="group-add"
              onClick={() => add(i)}
              disabled={!arranging}
              aria-label={params.holder === 'box' ? `Положить в коробку ${i + 1}` : `Положить на тарелку ${i + 1}`}
            />
            <div className="group-items">
              {Array.from({ length: n }, (_, k) => (
                <button key={k} className="tap small" onClick={() => remove(i)} disabled={!arranging} aria-label="Вернуть обратно">
                  <Emoji code={fruit.img} size={44} />
                </button>
              ))}
            </div>
            {help >= 2 && <span className="badge static">{n}</span>}
          </div>
        ))}
      </div>
      {help >= 3 && (
        <div className="sum-hint" aria-live="polite">
          {Array(params.groups).fill(params.per).join(' + ')}
        </div>
      )}
      {arranging ? (
        <button className="btn primary big" disabled={locked || used === 0} onClick={checkArrangement}>
          Готово
        </button>
      ) : (
        <>
          <div className="question">Сколько всего?</div>
          <div className="choices">
            {answerChoices(total).map((n) => (
              <button
                key={n}
                className="btn choice"
                disabled={locked}
                onClick={() => onSubmit({ correct: n === total, answer: `итог ${n}` })}
              >
                <NumberTile n={n} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
