import { expectedAnswer, type CardParams } from '../content/missions';
import { tenChoices } from '../content/numbers';
import { plural } from '../content/words';
import { NumberChoices } from './NumberChoices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'beads100' }>;

/** Сто бусин по десять в ряд, как на счётах. Прищепка стоит после n-й бусины. */
export function Beads100Game({ params, help, locked, onSubmit }: GameProps<P>) {
  const n = expectedAnswer(params);
  const tens = Math.floor(n / 10);
  return (
    <div className="game">
      <div className="more-scene beads100" role="img" aria-label="Сто бусин по десять в ряд">
        {Array.from({ length: 10 }, (_, r) => (
          <div key={r} className="bead-row">
            {help >= 2 && <span className="row-label">{r < tens ? (r + 1) * 10 : ''}</span>}
            {Array.from({ length: 10 }, (_, c) => {
              const i = r * 10 + c + 1;
              return (
                <span key={c} className={`b100 ${i <= n ? (c < 5 ? 'on a' : 'on b') : ''}`}>
                  {i === n && <span className="clip" aria-hidden="true" />}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {help >= 3 && <div className="sum-hint">{n % 10 ? `${tens * 10} и ещё ${n % 10}` : `${tens} ${plural(tens, 'десяток', 'десятка', 'десятков')}`}</div>}
      <NumberChoices options={tenChoices(n, 1, 100)} answer={n} locked={locked} onSubmit={onSubmit} />
    </div>
  );
}
