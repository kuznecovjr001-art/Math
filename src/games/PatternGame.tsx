import { useState, type CSSProperties } from 'react';
import { BEAD_NAME, type Bead, type CardParams } from '../content/missions';
import { Choices } from './Choices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'pattern' }>;

const ALL: Bead[] = ['red', 'blue', 'yellow', 'green'];

/** Варианты: цвета узора и ещё один, чтобы их было три. */
export function patternChoices(unit: Bead[]): Bead[] {
  const own = ALL.filter((c) => unit.includes(c));
  return [...own, ...ALL.filter((c) => !own.includes(c))].slice(0, Math.max(3, own.length));
}

/** После верного ответа «?» становится бусиной, и нитка продолжается ещё на один повтор узора. */
export function PatternGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, setSolved] = useState(false);
  const answer = params.unit[params.shown % params.unit.length];
  const beads = Array.from({ length: params.shown }, (_, i) => params.unit[i % params.unit.length]);
  const more = solved ? Array.from({ length: params.unit.length }, (_, k) => params.unit[(params.shown + 1 + k) % params.unit.length]) : [];
  return (
    <div className="game">
      <div className="string" role="img" aria-label={beads.map((b) => BEAD_NAME[b]).join(', ')}>
        {beads.map((b, i) => (
          <span key={i} className={`bead ${b} ${help >= 2 && i > 0 && i % params.unit.length === 0 ? 'gap' : ''}`} />
        ))}
        {solved
          ? <span className={`bead ${answer} placed`} />
          : <span className={`bead empty ${help >= 2 && params.shown % params.unit.length === 0 ? 'gap' : ''}`}>?</span>}
        {more.map((b, k) => <span key={`m${k}`} className={`bead ${b} grow`} style={{ '--i': k } as CSSProperties} />)}
      </div>
      <Choices<Bead>
        options={patternChoices(params.unit)}
        render={(b) => <span className={`bead big ${b}`} />}
        label={(b) => BEAD_NAME[b]}
        disabled={locked}
        onPick={(b) => {
          if (b === answer) setSolved(true);
          onSubmit({ correct: b === answer, answer: BEAD_NAME[b], showMs: b === answer ? params.unit.length * 220 + 600 : undefined });
        }}
      />
    </div>
  );
}
