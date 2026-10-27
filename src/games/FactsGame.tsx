import { useState, type CSSProperties } from 'react';
import { factChoices, type CardParams } from '../content/missions';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'facts' }>;

/** Группы появляются по одной; весь показ укладывается примерно в 2 с при любом b. */
const groupMs = (b: number) => Math.min(320, Math.round(2000 / b));

/** Модель «по a, b раз»: b групп по a точек. С count под группами бежит счёт a, 2a, 3a… */
function DotGroups({ a, b, count = false }: { a: number; b: number; count?: boolean }) {
  return (
    <div className="dot-groups" role="img" aria-label={`${b} ${b === 1 ? 'группа' : 'групп'} по ${a}`}
      style={{ '--step': `${groupMs(b)}ms` } as CSSProperties}>
      {Array.from({ length: b }, (_, g) => (
        // Группы появляются по одной: «по a» — одна группа, «b раз» — столько групп.
        <span key={g} className="dot-group" style={{ '--g': g } as CSSProperties}>
          {Array.from({ length: a }, (_, i) => <i key={i} />)}
          {count && <b className="group-sum">{a * (g + 1)}</b>}
        </span>
      ))}
    </div>
  );
}

/** После верного ответа группы выкладываются заново с бегущим счётом: видно, откуда взялось произведение. */
export function FactsGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, setSolved] = useState(false);
  const answer = params.a * params.b;
  return (
    <div className="game">
      <div className="fact">{params.a} × {params.b} = {solved ? answer : '?'}</div>
      {(params.model || help >= 2 || solved) && <DotGroups key={String(solved)} a={params.a} b={params.b} count={solved} />}
      <Choices
        options={factChoices(params.a, params.b)}
        render={(n) => <NumberTile n={n} dots={false} />}
        disabled={locked}
        onPick={(n) => {
          if (n === answer) setSolved(true);
          onSubmit({ correct: n === answer, answer: String(n), showMs: n === answer ? groupMs(params.b) * params.b + 600 : undefined });
        }}
      />
    </div>
  );
}
