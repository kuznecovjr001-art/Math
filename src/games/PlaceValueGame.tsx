import { expectedAnswer, type CardParams } from '../content/missions';
import { customArt } from '../content/art';
import { placeChoices } from '../content/numbers';
import { NumberChoices } from './NumberChoices';
import { useSolved, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'placeValue' }>;

const BLOCK = { flat: ['item/block-hundred', 80, 80], rod: ['item/block-ten', 9, 80], unit: ['item/block-one', 9, 9] } as const;

/** Блоки Дьенеша: квадрат — сотня, полоска — десяток, кубик — единица. Свои рисунки item/block-* заменяют нарисованные блоки. */
export function PlaceValueGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, submit] = useSolved(onSubmit);
  const answer = expectedAnswer(params);
  const group = (n: number, cls: keyof typeof BLOCK, name: string) => {
    const [path, w, h] = BLOCK[cls];
    const own = customArt(path);
    return (
    <div className="pv-col">
      <div className={`pv-group ${cls}`}>
        {Array.from({ length: n }, (_, i) => own
          ? <img key={i} src={own} width={w} height={h} alt="" aria-hidden="true" draggable={false} />
          : <span key={i} className={`pv ${cls}`} />)}
      </div>
      {help >= 2 && <span className={`pv-cap ${cls}`}>{name}</span>}
    </div>
    );
  };
  return (
    <div className="game">
      <div className="more-scene pv-scene" role="img" aria-label="Блоки: сотни, десятки и единицы">
        {group(params.h, 'flat', `${params.h} × 100`)}
        {group(params.t, 'rod', `${params.t} × 10`)}
        {group(params.o, 'unit', `${params.o} × 1`)}
      </div>
      {(help >= 3 || solved) && <div className="sum-hint">{params.h * 100} + {params.t * 10} + {params.o}</div>}
      <NumberChoices options={placeChoices(params.h, params.t, params.o)} answer={answer} locked={locked} onSubmit={submit} />
    </div>
  );
}
