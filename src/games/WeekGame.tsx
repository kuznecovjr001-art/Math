import { expectedAnswer, type CardParams } from '../content/missions';
import { WEEK, weekChoices } from '../content/numbers';
import { Choices } from './Choices';
import { useSolved, type GameProps } from './types';

/** Общепринятые сокращения дней недели («че», «су» не читаются). */
const SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

type P = Extract<CardParams, { kind: 'week' }>;

/** Дни недели по кругу. С подсказкой видна вся неделя, затем подсвечен соседний день. */
export function WeekGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  const [solved, submit] = useSolved(onSubmit);
  return (
    <div className="game">
      <div className="more-scene week-scene">
        {help >= 2 ? (
          <ol className="week-strip">
            {WEEK.map((d, i) => (
              <li key={d} className={`${i === params.day ? 'now' : ''} ${(help >= 3 || solved) && i === answer ? 'next' : ''}`}>
                {i === params.day || ((help >= 3 || solved) && i === answer) ? d : SHORT[i]}
              </li>
            ))}
          </ol>
        ) : (
          <div className="week-one">
            {params.dir === -1 && <span className={`week-q ${solved ? 'revealed' : ''}`}>{solved ? WEEK[answer] : '?'}</span>}
            <span className="arrow" aria-hidden="true">{params.dir === -1 ? '→' : ''}</span>
            <span className="week-day">{WEEK[params.day]}</span>
            <span className="arrow" aria-hidden="true">{params.dir === 1 ? '→' : ''}</span>
            {params.dir === 1 && <span className={`week-q ${solved ? 'revealed' : ''}`}>{solved ? WEEK[answer] : '?'}</span>}
          </div>
        )}
      </div>
      <Choices
        options={weekChoices(params)}
        render={(d) => <span className="word">{WEEK[d]}</span>}
        disabled={locked}
        onPick={(d) => submit({ correct: d === answer, answer: WEEK[d] })}
      />
    </div>
  );
}
