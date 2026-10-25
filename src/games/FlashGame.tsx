import { useEffect, useState } from 'react';
import type { CardParams } from '../content/missions';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'flash' }>;

/** Клетки 3 × 3 для кубика (номера клеток 0–8). */
const DICE: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

/** Сколько миллисекунд карточка открыта: время на взгляд, а не на ответ. */
export const FLASH_MS = 1500;

export function FlashGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [open, setOpen] = useState(true);
  const stayOpen = help >= 2;

  useEffect(() => {
    if (!open || stayOpen) return;
    const t = setTimeout(() => setOpen(false), FLASH_MS);
    return () => clearTimeout(t);
  }, [open, stayOpen]);

  const dice = params.layout === 'dice' && DICE[params.n];
  const cells = dice ? 9 : 10;
  let k = 0;
  return (
    <div className="game">
      <div className={`flash-card ${dice ? 'dice' : 'frame'}`} aria-label={open || stayOpen ? `${params.n} точек` : 'Карточка закрыта'}>
        {open || stayOpen
          ? Array.from({ length: cells }, (_, i) => {
              const on = dice ? dice.includes(i) : i < params.n;
              return (
                <span key={i} className="flash-cell">
                  {on && <i className="flash-dot">{help >= 3 ? ++k : ''}</i>}
                </span>
              );
            })
          : <button className="btn flash-again" onClick={() => setOpen(true)}>Показать ещё раз</button>}
      </div>
      <Choices
        options={answerChoices(params.n)}
        render={(n) => <NumberTile n={n} dots={false} />}
        disabled={locked}
        onPick={(n) => onSubmit({ correct: n === params.n, answer: String(n) })}
      />
    </div>
  );
}
