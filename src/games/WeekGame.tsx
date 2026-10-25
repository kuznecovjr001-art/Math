import { expectedAnswer, type CardParams } from '../content/missions';
import { WEEK, weekChoices } from '../content/numbers';
import { Choices } from './Choices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'week' }>;

/** Дни недели по кругу. С подсказкой видна вся неделя, затем подсвечен соседний день. */
export function WeekGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  return (
    <div className="game">
      <div className="more-scene week-scene">
        {help >= 2 ? (
          <ol className="week-strip">
            {WEEK.map((d, i) => (
              <li key={d} className={`${i === params.day ? 'now' : ''} ${help >= 3 && i === answer ? 'next' : ''}`}>
                {i === params.day || (help >= 3 && i === answer) ? d : d.slice(0, 2)}
              </li>
            ))}
          </ol>
        ) : (
          <div className="week-one">
            {params.dir === -1 && <span className="week-q">?</span>}
            <span className="arrow" aria-hidden="true">{params.dir === -1 ? '→' : ''}</span>
            <span className="week-day">{WEEK[params.day]}</span>
            <span className="arrow" aria-hidden="true">{params.dir === 1 ? '→' : ''}</span>
            {params.dir === 1 && <span className="week-q">?</span>}
          </div>
        )}
      </div>
      <Choices
        options={weekChoices(params)}
        render={(d) => <span className="word">{WEEK[d]}</span>}
        disabled={locked}
        onPick={(d) => onSubmit({ correct: d === answer, answer: WEEK[d] })}
      />
    </div>
  );
}
