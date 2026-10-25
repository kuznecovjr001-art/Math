import { expectedAnswer, type CardParams } from '../content/missions';
import { GROUP_HOLDER } from '../content/numbers';
import { Emoji, Plate } from '../ui/art';
import { NumberChoices } from './NumberChoices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'groupsOf' }>;

function Holder({ code }: { code: string }) {
  return code === 'plate' ? <Plate size={64} /> : <Emoji code={code} size={64} />;
}

/** Деление по сколько: колёса раздаём велосипедам по два, печенье — тарелкам по три. */
export function GroupsOfGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const g = GROUP_HOLDER[params.size];
  const groups = expectedAnswer(params);
  return (
    <div className="game">
      {help < 2 ? (
        <div className="more-scene group-pile">
          {Array.from({ length: params.total }, (_, i) => <Emoji key={i} code={g.item} size={44} />)}
        </div>
      ) : (
        <div className="more-scene group-sets">
          {Array.from({ length: groups }, (_, k) => (
            <div key={k} className="group-set">
              <Holder code={g.holder} />
              <div className="group-items">
                {Array.from({ length: params.size }, (_, i) => <Emoji key={i} code={g.item} size={32} />)}
              </div>
              {help >= 3 && <span className="badge">{k + 1}</span>}
            </div>
          ))}
        </div>
      )}
      {help >= 3 && <div className="sum-hint">{Array(groups).fill(params.size).join(' + ')} = {params.total}</div>}
      <NumberChoices options={answerChoices(groups)} answer={groups} locked={locked} onSubmit={onSubmit} />
    </div>
  );
}
