import { expectedAnswer, type CardParams } from '../content/missions';
import { placeChoices } from '../content/numbers';
import { NumberChoices } from './NumberChoices';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'placeValue' }>;

/** Блоки Дьенеша: квадрат — сотня, полоска — десяток, кубик — единица. */
export function PlaceValueGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  const group = (n: number, cls: string, name: string) => (
    <div className="pv-col">
      <div className={`pv-group ${cls}`}>
        {Array.from({ length: n }, (_, i) => <span key={i} className={`pv ${cls}`} />)}
      </div>
      {help >= 2 && <span className={`pv-cap ${cls}`}>{name}</span>}
    </div>
  );
  return (
    <div className="game">
      <div className="more-scene pv-scene" role="img" aria-label="Блоки: сотни, десятки и единицы">
        {group(params.h, 'flat', `${params.h} × 100`)}
        {group(params.t, 'rod', `${params.t} × 10`)}
        {group(params.o, 'unit', `${params.o} × 1`)}
      </div>
      {help >= 3 && <div className="sum-hint">{params.h * 100} + {params.t * 10} + {params.o}</div>}
      <NumberChoices options={placeChoices(params.h, params.t, params.o)} answer={answer} locked={locked} onSubmit={onSubmit} />
    </div>
  );
}
