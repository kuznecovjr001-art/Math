import { expectedAnswer, type CardParams } from '../content/missions';
import { tenChoices } from '../content/numbers';
import { NumberChoices } from './NumberChoices';
import { useSolved, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'chart100' }>;

/** Таблица 1–100, одна клетка спрятана. Подсказка показывает соседей сверху, снизу и по бокам. */
export function Chart100Game({ params, help, locked, onSubmit }: GameProps<P>) {
  const m = expectedAnswer(params);
  const [solved, submit] = useSolved(onSubmit);
  const near = new Set([m - 10, m + 10, ...(m % 10 !== 1 ? [m - 1] : []), ...(m % 10 !== 0 ? [m + 1] : [])]);
  return (
    <div className="game">
      <div className="more-scene chart100" role="img" aria-label="Таблица чисел от 1 до 100, одно число спрятано">
        {Array.from({ length: 100 }, (_, i) => {
          const v = i + 1;
          const cls = v === m ? 'hide' : help >= 2 && near.has(v) ? 'near' : '';
          return <span key={v} className={`c100 ${cls} ${v === m && solved ? 'revealed' : ''}`}>{v === m && !solved ? '?' : v}</span>;
        })}
      </div>
      {(help >= 3 || solved) && <div className="sum-hint">Над ним {m - 10 > 0 ? m - 10 : '—'}, значит на 10 больше</div>}
      <NumberChoices options={tenChoices(m, 1, 100)} answer={m} locked={locked} onSubmit={submit} />
    </div>
  );
}
