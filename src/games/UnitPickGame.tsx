import { expectedAnswer, type CardParams } from '../content/missions';
import { MEASURE_THINGS, UNITS } from '../content/numbers';
import { Emoji } from '../ui/art';
import { Choices } from './Choices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'unitPick' }>;

const KIND_HINT = { m: 'Длину меряют метрами', l: 'Жидкость меряют литрами', kg: 'Вес меряют килограммами' };

/** Чем мерить: метр, литр или килограмм. */
export function UnitPickGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  const thing = MEASURE_THINGS[params.thing];
  return (
    <div className="game">
      <div className="more-scene unit-thing">
        <Emoji code={thing.icon} size={110} />
      </div>
      {help >= 3 && <div className="sum-hint">{KIND_HINT[thing.unit]}</div>}
      <Choices
        options={UNITS.map((_, i) => i)}
        render={(i) => (
          <span className="unit-choice">
            <Emoji code={UNITS[i].icon} size={56} />
            <span className="word">{UNITS[i].name}</span>
          </span>
        )}
        label={(i) => UNITS[i].name}
        disabled={locked}
        onPick={(i) => onSubmit({ correct: i === answer, answer: UNITS[i].name })}
      />
    </div>
  );
}
