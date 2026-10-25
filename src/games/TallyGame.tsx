import { expectedAnswer, ITEMS, type CardParams, type ItemId } from '../content/missions';
import { Emoji } from '../ui/art';
import { Choices } from './Choices';
import { NumberChoices } from './NumberChoices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'tally' }>;

function Marks({ n }: { n: number }) {
  // Палочки группами по пять, пятая перечёркивает четыре.
  const groups = Array.from({ length: Math.ceil(n / 5) }, (_, g) => Math.min(5, n - g * 5));
  return (
    <span className="marks" role="img" aria-label={String(n)}>
      {groups.map((k, g) => <span key={g} className={`mark-group ${k === 5 ? 'five' : ''}`}>{'|'.repeat(Math.min(k, 4))}</span>)}
    </span>
  );
}

/** Фрукты вперемешку в корзине. Подсказка — таблица с палочками, как в учебнике. */
export function TallyGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const all: ItemId[] = params.counts.flatMap(([id, n]) => Array<ItemId>(n).fill(id));
  // Перемешиваем без случайности, чтобы картинка не прыгала между отрисовками.
  const mixed = all.map((id, i) => ({ id, k: (i * 7 + 3) % (all.length + 1) })).sort((a, b) => a.k - b.k);
  const answer = expectedAnswer(params);
  return (
    <div className="game">
      <div className="more-scene tally-pile">
        {mixed.map((x, i) => <Emoji key={i} code={ITEMS[x.id].img} size={48} label={ITEMS[x.id].forms[0]} />)}
      </div>
      {help >= 2 && (
        <table className="tally-table">
          <tbody>
            {params.counts.map(([id, n]) => (
              <tr key={id}>
                <td><Emoji code={ITEMS[id].img} size={36} label={ITEMS[id].forms[0]} /></td>
                <td><Marks n={n} /></td>
                {help >= 3 && <td className="tally-n">{n}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {params.ask === 'most' ? (
        <Choices
          options={params.counts.map((_, i) => i)}
          render={(i) => <Emoji code={ITEMS[params.counts[i][0]].img} size={64} />}
          label={(i) => ITEMS[params.counts[i][0]].forms[2]}
          disabled={locked}
          onPick={(i) => onSubmit({ correct: i === answer, answer: params.counts[i][0] })}
        />
      ) : (
        <NumberChoices options={answerChoices(answer)} answer={answer} locked={locked} onSubmit={onSubmit} />
      )}
    </div>
  );
}
