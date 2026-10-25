import { factChoices, type CardParams } from '../content/missions';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'facts' }>;

/** Модель «по a, b раз»: b групп по a точек. */
function DotGroups({ a, b }: { a: number; b: number }) {
  return (
    <div className="dot-groups" role="img" aria-label={`${b} ${b === 1 ? 'группа' : 'групп'} по ${a}`}>
      {Array.from({ length: b }, (_, g) => (
        <span key={g} className="dot-group">
          {Array.from({ length: a }, (_, i) => <i key={i} />)}
        </span>
      ))}
    </div>
  );
}

export function FactsGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = params.a * params.b;
  return (
    <div className="game">
      <div className="fact">{params.a} × {params.b} = ?</div>
      {(params.model || help >= 2) && <DotGroups a={params.a} b={params.b} />}
      <Choices
        options={factChoices(params.a, params.b)}
        render={(n) => <NumberTile n={n} dots={false} />}
        disabled={locked}
        onPick={(n) => onSubmit({ correct: n === answer, answer: String(n) })}
      />
    </div>
  );
}
