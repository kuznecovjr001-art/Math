import { useState } from 'react';
import { sfx } from '../audio/sfx';
import { FRUITS, type CardParams } from '../content/missions';
import { Emoji } from '../ui/art';
import { NumberTile } from '../ui/NumberTile';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'basket' }>;

export function BasketGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [inBasket, setInBasket] = useState(0);
  const fruit = FRUITS[params.fruit];
  const stock = params.stock - inBasket;

  const put = () => {
    if (locked || stock <= 0) return;
    sfx.pop();
    setInBasket((n) => n + 1);
  };
  const take = () => {
    if (locked || inBasket <= 0) return;
    sfx.back();
    setInBasket((n) => n - 1);
  };

  // Ступень 3: в корзине видны места на нужное количество.
  const slots = help >= 3 ? Math.max(params.target, inBasket) : inBasket;

  return (
    <div className="game">
      {params.cue === 'digit' && (
        <div className="digit-cue" aria-label={`Цифра ${params.target}`}>
          <NumberTile n={params.target} dots={help >= 2} />
        </div>
      )}
      <div className="stock wide">
        {Array.from({ length: stock }, (_, i) => (
          <button key={i} className="tap" onClick={put} aria-label={`Положить: ${fruit.forms[0]}`}>
            <Emoji code={fruit.img} size={60} />
          </button>
        ))}
      </div>
      <div className="basket" aria-label={`В корзине ${inBasket}`}>
        <div className="basket-items">
          {Array.from({ length: slots }, (_, i) =>
            i < inBasket ? (
              <button key={i} className="tap counted" onClick={take} aria-label="Вернуть обратно">
                <Emoji code={fruit.img} size={56} />
                {help >= 2 && <span className="badge">{i + 1}</span>}
              </button>
            ) : (
              <span key={i} className="slot" aria-hidden="true" />
            ),
          )}
        </div>
        <div className="basket-label">Корзина</div>
      </div>
      <button
        className="btn primary big"
        disabled={locked || inBasket === 0}
        onClick={() => onSubmit({ correct: inBasket === params.target, answer: String(inBasket) })}
      >
        Готово
      </button>
    </div>
  );
}
