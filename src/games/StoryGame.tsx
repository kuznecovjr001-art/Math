import { useState, type CSSProperties } from 'react';
import { PHRASE } from '../audio/phrases';
import type { CardParams } from '../content/missions';
import { storyArt } from '../ui/art';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'story' }>;

/**
 * Модель действия точками — показ после верного ответа: «+» две кучки вместе, «−» часть уходит,
 * «×» и «:» — равные группы. Для больших чисел (больше 40 точек) не рисуем: точки не сосчитать глазом.
 */
export function ExprModel({ expr }: { expr: string }) {
  const m = /^(\d+) ([+−×:]) (\d+)$/.exec(expr);
  if (!m) return null;
  const [a, op, b] = [Number(m[1]), m[2], Number(m[3])];
  const dots = (n: number, cls = '', from = 0) => Array.from({ length: n }, (_, i) => (
    <i key={from + i} className={cls} style={{ '--i': from + i } as CSSProperties} />
  ));
  if (op === '+' && a + b <= 40) return <div className="expr-model">{dots(a, 'p')}{dots(b, 'q', a)}</div>;
  if (op === '−' && a <= 40) return <div className="expr-model">{dots(a - b, 'p')}{dots(b, 'gone', a - b)}</div>;
  const [per, groups] = op === '×' ? [a, b] : [a / b, b];
  if ((op === '×' || op === ':') && Number.isInteger(per) && per * groups <= 40) {
    return (
      <div className="dot-groups">
        {Array.from({ length: groups }, (_, g) => (
          <span key={g} className="dot-group" style={{ '--g': g } as CSSProperties}>{dots(per)}</span>
        ))}
      </div>
    );
  }
  return null;
}

/** Сначала выбрать действие, потом найти ответ: так видно, где именно ошибка. */
export function StoryGame({ params, locked, onSubmit }: GameProps<P>) {
  const [step, setStep] = useState<'op' | 'answer' | 'solved'>('op');
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
          <div className="question">{params.ops[params.op]} = {step === 'solved' ? params.answer : '?'}</div>
          {step === 'solved' && <ExprModel expr={params.ops[params.op]} />}
          <Choices
            options={answerChoices(params.answer, 0)}
            render={(n) => <NumberTile n={n} dots={false} />}
            disabled={locked}
            onPick={(n) => {
              if (n === params.answer) setStep('solved');
              onSubmit({ correct: n === params.answer, answer: `итог ${n}`, showMs: n === params.answer ? 1800 : undefined });
            }}
          />
        </>
      )}
    </div>
  );
}
