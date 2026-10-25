import { useState } from 'react';
import { type CardParams } from '../content/missions';
import { COINS } from '../content/numbers';
import { customArt } from '../content/art';
import { Emoji } from '../ui/art';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'coins' }>;

function Coin({ v }: { v: number }) {
  const own = customArt(`item/coin-${v}`);
  return own
    ? <img src={own} width={56} height={56} alt="" aria-hidden="true" />
    : <span className={`coin c${v}`} aria-hidden="true">{v}</span>;
}

/** Один из простых способов набрать цену крупными монетами — разобранный пример. */
function greedy(price: number): number[] {
  const out: number[] = [];
  let rest = price;
  for (const c of [...COINS].reverse()) while (rest >= c) { out.push(c); rest -= c; }
  return out;
}

/** Магазин: ребёнок кладёт монеты на блюдце и платит ровно столько, сколько стоит игрушка. */
export function CoinsGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [tray, setTray] = useState<number[]>([]);
  const sum = tray.reduce((a, b) => a + b, 0);
  return (
    <div className="game">
      <div className="more-scene shop">
        <div className="price-tag">
          <Emoji code={params.toy} size={84} label={params.name} />
          <span className="price">{params.price} ₽</span>
        </div>
        <div className="tray" aria-label={`На блюдце ${sum} ₽`}>
          {tray.length === 0 && <span className="tray-empty">Блюдце</span>}
          {tray.map((v, i) => (
            <button key={i} className="coin-btn" disabled={locked} onClick={() => setTray(tray.filter((_, k) => k !== i))} aria-label={`Убрать монету ${v}`}>
              <Coin v={v} />
            </button>
          ))}
        </div>
        {help >= 2 && <div className="sum-hint">На блюдце {sum} ₽</div>}
        {help >= 3 && <div className="sum-hint">Например: {greedy(params.price).join(' + ')}</div>}
      </div>
      <div className="choices coins-row">
        {COINS.map((v) => (
          <button key={v} className="btn choice coin-pick" disabled={locked} onClick={() => setTray([...tray, v])} aria-label={`Монета ${v} ₽`}>
            <Coin v={v} />
          </button>
        ))}
      </div>
      <button
        className="btn primary big pay"
        disabled={locked || sum === 0}
        onClick={() => { onSubmit({ correct: sum === params.price, answer: String(sum) }); if (sum !== params.price) setTray([]); }}
      >
        Оплатить
      </button>
    </div>
  );
}
