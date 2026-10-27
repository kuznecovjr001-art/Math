import { useState } from 'react';
import { sfx } from '../audio/sfx';
import type { CardParams } from '../content/missions';
import { Emoji } from '../ui/art';
import { useSolved, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'order' }>;

const PARTS = ['утро', 'день', 'вечер', 'ночь'];

/** Картинки перемешаны всегда одинаково: первая уходит в конец ряда. */
export function shuffled<T>(xs: T[]): T[] {
  return [...xs.slice(1), xs[0]];
}

export function OrderGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, submit] = useSolved(onSubmit);
  const pool = shuffled(params.events.map((e, i) => ({ ...e, i })));
  const [seq, setSeq] = useState<number[]>([]);
  // Подсказка 3 показывает, что ставить следующим, если начало ряда уже верное.
  const nextRight = seq.every((x, k) => x === k) ? seq.length : -1;

  const take = (i: number) => {
    if (locked || seq.includes(i)) return;
    sfx.pop();
    setSeq((s) => [...s, i]);
  };
  const drop = (i: number) => {
    if (locked) return;
    sfx.back();
    setSeq((s) => s.filter((x) => x !== i));
  };
  const check = () => submit({
    correct: seq.every((x, k) => x === k),
    answer: seq.map((x) => params.events[x].name).join(' → '),
  });

  const parts = params.events.length === 3 ? ['утро', 'день', 'вечер'] : PARTS;
  return (
    <div className="game">
      <ol className="timeline">
        {params.events.map((_, k) => {
          const x = seq[k];
          return (
            <li key={k} className="timeline-slot">
              {x !== undefined
                ? (
                  <button className="tap" onClick={() => drop(x)} disabled={locked} aria-label={`Убрать: ${params.events[x].name}`}>
                    <Emoji code={params.events[x].icon} size={64} />
                  </button>
                )
                : <span className="slot" aria-hidden="true" />}
              {help >= 2 && <span className="zone-label">{parts[k]}</span>}
            </li>
          );
        })}
      </ol>
      <div className="choices">
        {pool.map((e) => (
          <button
            key={e.i}
            className={`btn choice ${(help >= 3 || solved) && e.i === nextRight ? 'attention' : ''}`}
            disabled={locked || seq.includes(e.i)}
            onClick={() => take(e.i)}
          >
            <span className="tile">
              <Emoji code={e.icon} size={64} />
              <span className="choice-caption">{e.name}</span>
            </span>
          </button>
        ))}
      </div>
      {seq.length === params.events.length && (
        <button className="btn primary big" disabled={locked} onClick={check}>Готово</button>
      )}
    </div>
  );
}
