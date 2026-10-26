import { useEffect, useState } from 'react';
import { expectedAnswer, type CardParams } from '../content/missions';
import { Icon, Parcel } from '../ui/art';
import { NumberTile } from '../ui/NumberTile';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'parcels' }>;
type Stage = 'start' | 'change' | 'ask';

export function ParcelsGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [stage, setStage] = useState<Stage>('start');
  const [replay, setReplay] = useState(0);
  const answer = expectedAnswer(params);

  // Ступень 2: проигрываем изменение ещё раз.
  useEffect(() => {
    if (help === 2) setReplay((r) => r + 1);
  }, [help]);

  useEffect(() => {
    setStage('start');
    const t1 = setTimeout(() => setStage('change'), 1800);
    const t2 = setTimeout(() => setStage('ask'), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [replay, params]);

  const total = params.op === 'add' ? params.start + params.change : params.start;
  const items = Array.from({ length: total }, (_, i) => {
    const isChange = params.op === 'add' ? i >= params.start : i >= params.start - params.change;
    let cls = 'parcel';
    if (isChange && params.op === 'add') cls += stage === 'start' ? ' hidden' : ' arrive';
    if (isChange && params.op === 'sub' && stage !== 'start') cls += ' leave';
    return { i, cls, stays: !(isChange && params.op === 'sub') };
  });

  let stayNo = 0;
  return (
    <div className="game">
      <div className="warehouse" aria-live="polite">
        <div className="warehouse-label">
          {stage === 'start' && `Было: ${params.start}`}
          {stage !== 'start' && (params.op === 'add' ? `Привезли ещё ${params.change}` : `Отправили ${params.change}`)}
        </div>
        <div className="parcels">
          {items.map(({ i, cls, stays }) => {
            if (stays) stayNo += 1;
            return (
              <div key={`${replay}-${i}`} className={cls}>
                <Parcel size={64} />
                {help >= 3 && stage === 'ask' && stays && <span className="badge">{stayNo}</span>}
              </div>
            );
          })}
        </div>
      </div>
      {stage === 'ask' && (
        <button className="btn icon replay" onClick={() => setReplay((r) => r + 1)} disabled={locked} aria-label="Показать ещё раз">
          <Icon name="review" size={36} />
        </button>
      )}
      {/* Пока идёт сценка, ответы спрятаны, а не «серые»: ребёнок смотрит на склад, а не на неактивные кнопки. */}
      <div className={`choices ${stage === 'ask' ? 'ready' : 'waiting'}`}>
        {answerChoices(answer, 0).map((n) => (
          <button
            key={n}
            className="btn choice"
            disabled={locked || stage !== 'ask'}
            onClick={() => onSubmit({ correct: n === answer, answer: String(n) })}
          >
            <NumberTile n={n} />
          </button>
        ))}
      </div>
    </div>
  );
}
