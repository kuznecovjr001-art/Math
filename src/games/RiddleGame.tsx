import { expectedAnswer, type CardParams } from '../content/missions';
import { PLACE_NAME, riddleChoices } from '../content/numbers';
import { NumberChoices } from './NumberChoices';
import { useSolved, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'riddle' }>;


/** Загадка: разряды названы вперемешку. Подсказка раскладывает их по столбикам таблицы разрядов. */
export function RiddleGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, submit] = useSolved(onSubmit);
  const answer = expectedAnswer(params);
  return (
    <div className="game">
      <div className="more-scene riddle-clues">
        {params.order.map((k) => <span key={k} className={`clue ${k}`}>{PLACE_NAME[k](params[k])}</span>)}
      </div>
      {help >= 2 && (
        <table className="pv-table">
          <thead><tr><th>Сотни</th><th>Десятки</th><th>Единицы</th></tr></thead>
          <tbody><tr>
            <td className="h">{params.h}</td><td className="t">{(help >= 3 || solved) ? params.t : '?'}</td><td className="o">{(help >= 3 || solved) ? params.o : '?'}</td>
          </tr></tbody>
        </table>
      )}
      <NumberChoices options={riddleChoices(params)} answer={answer} locked={locked} onSubmit={submit} />
    </div>
  );
}
