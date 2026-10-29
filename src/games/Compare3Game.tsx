import { expectedAnswer, type CardParams } from '../content/missions';
import { SIGNS } from '../content/numbers';
import { Choices } from './Choices';
import { useSolved, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'compare3' }>;

const SIGN_NAME: Record<string, string> = { '<': 'меньше', '=': 'равно', '>': 'больше' };

function Digits({ n, help }: { n: number; help: number }) {
  const d = String(n).padStart(3, '0').split('');
  return (
    <span className="cmp-num">
      {d.map((c, i) => <span key={i} className={help >= 2 ? ['h', 't', 'o'][i] : ''}>{c}</span>)}
    </span>
  );
}

/** Сравнение трёхзначных чисел: сначала сотни, потом десятки, потом единицы. */
export function Compare3Game({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  const [solved, submit] = useSolved(onSubmit);
  const da = String(params.a).split('');
  const db = String(params.b).split('');
  const first = da.findIndex((c, i) => c !== db[i]);
  const place = ['сотни', 'десятки', 'единицы'][first];
  return (
    <div className="game">
      <div className="more-scene cmp-scene">
        <Digits n={params.a} help={help} />
        <span className={`cmp-slot ${solved ? 'revealed' : ''}`}>{solved ? SIGNS[answer] : '?'}</span>
        <Digits n={params.b} help={help} />
      </div>
      {(help >= 3 || solved) && (
        <div className="sum-hint">
          {first < 0 ? 'Все цифры одинаковые' : `Сравни ${place}: ${da[first]} и ${db[first]}`}
        </div>
      )}
      <Choices
        options={SIGNS.map((_, i) => i)}
        render={(i) => <span className="sign">{SIGNS[i]}</span>}
        label={(i) => SIGN_NAME[SIGNS[i]]}
        disabled={locked}
        onPick={(i) => submit({ correct: i === answer, answer: SIGNS[i] })}
      />
    </div>
  );
}
