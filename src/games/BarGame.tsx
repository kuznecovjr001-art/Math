import { expectedAnswer, type CardParams } from '../content/missions';
import { BAR_STORY, tenChoices } from '../content/numbers';
import { customArt } from '../content/art';
import { Emoji } from '../ui/art';
import { NumberChoices } from './NumberChoices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'bar' }>;

/** Схема-полоска: целое сверху, две части снизу. Неизвестное отмечено знаком вопроса. */
export function BarGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  const whole = params.a + params.b;
  const s = BAR_STORY[params.story];
  const known = params.find === 'part';
  const art = customArt(`item/story-${params.story}`);
  return (
    <div className="game">
      <div className="more-scene bar-scene">
        {art ? <img src={art} width={168} height={112} alt="" aria-hidden="true" /> : <Emoji code={s.icon} size={56} />}
        <div className="bar-model" role="img" aria-label="Схема задачи">
          <div className="bar whole">{known ? whole : '?'}</div>
          <div className="bar-parts">
            <div className="bar part a" style={{ flex: params.a }}>{params.a}</div>
            <div className="bar part b" style={{ flex: params.b }}>{known ? '?' : params.b}</div>
          </div>
        </div>
      </div>
      {help >= 3 && <div className="sum-hint">{known ? `${whole} − ${params.a}` : `${params.a} + ${params.b}`}</div>}
      <NumberChoices options={tenChoices(answer, 1, 200)} answer={answer} locked={locked} onSubmit={onSubmit} />
    </div>
  );
}
