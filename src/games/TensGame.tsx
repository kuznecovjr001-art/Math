import { expectedAnswer, type CardParams } from '../content/missions';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'tens' }>;

function Sticks({ n }: { n: number }) {
  return (
    <span className="sticks">
      {Array.from({ length: n }, (_, i) => <i key={i} className="stick" />)}
    </span>
  );
}

/** Частые ошибки разрядности: перепутать десятки и единицы, сложить цифры. */
export function tensChoices(tens: number, ones: number): number[] {
  const right = tens * 10 + ones;
  const cands = [ones * 10 + tens, tens + ones, right + 10, right - 10, right + 1];
  const wrong = [...new Set(cands.filter((x) => x > 0 && x !== right))].slice(0, 2);
  const all = [right, ...wrong].sort((a, b) => a - b);
  const shift = (tens + ones) % 3;
  return all.slice(shift).concat(all.slice(0, shift));
}

export function TensGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  return (
    <div className="game">
      <div className="tens-scene">
        {Array.from({ length: params.tens }, (_, i) => (
          <span key={`t${i}`} className="bundle">
            <Sticks n={10} />
            <span className="bundle-band" />
            {help >= 2 && <span className="badge">10</span>}
          </span>
        ))}
        {params.ones > 0 && <span className="loose"><Sticks n={params.ones} /></span>}
      </div>
      {help >= 3 && (
        <div className="sum-hint">
          {[...Array(params.tens).fill(10), ...(params.ones ? [params.ones] : [])].join(' + ')}
        </div>
      )}
      <Choices
        options={tensChoices(params.tens, params.ones)}
        render={(n) => <NumberTile n={n} dots={false} />}
        disabled={locked}
        onPick={(n) => onSubmit({ correct: n === answer, answer: String(n) })}
      />
    </div>
  );
}
