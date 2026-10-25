import { useEffect, useState } from 'react';
import { sfx } from '../audio/sfx';
import type { CardParams } from '../content/missions';
import { Cup, Emoji, Plate, Spoon } from '../ui/art';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'cups' }>;

const GUESTS = ['1F431', '1F436', '1F430', '1F43B', '1F98A'];
const GUEST_NAMES = ['котёнок', 'щенок', 'зайчик', 'медвежонок', 'лисёнок'];

export function CupsGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [given, setGiven] = useState<number[]>(() => Array(params.receivers).fill(0));
  const used = given.reduce((s, x) => s + x, 0);
  const stock = params.items - used;
  const Item = params.scene === 'tea' ? Cup : Spoon;

  const give = (i: number) => {
    if (locked || stock <= 0) return;
    sfx.pop();
    setGiven((g) => g.map((x, j) => (j === i ? x + 1 : x)));
  };
  const takeBack = (i: number) => {
    if (locked || given[i] === 0) return;
    sfx.back();
    setGiven((g) => g.map((x, j) => (j === i ? x - 1 : x)));
  };

  // Ступень 3: показываем один ход на примере.
  useEffect(() => {
    if (help !== 3) return;
    setGiven((g) => {
      const i = g.indexOf(0);
      const left = params.items - g.reduce((s, x) => s + x, 0);
      if (i < 0 || left <= 0) return g;
      return g.map((x, j) => (j === i ? 1 : x));
    });
  }, [help]);

  return (
    <div className="game">
      <div className="stock" role="group" aria-label={`Осталось ${stock}`}>
        {Array.from({ length: stock }, (_, i) => <Item key={i} />)}
        {stock === 0 && <span className="stock-empty">Всё раздали</span>}
      </div>
      <div className="receivers">
        {given.map((n, i) => (
          <div key={i} className={`receiver ${help >= 2 && n !== 1 ? 'attention' : ''}`}>
            <button
              className="tap receiver-main"
              onClick={() => give(i)}
              aria-label={params.scene === 'tea' ? `Дать чашку: ${GUEST_NAMES[i]}` : `Положить ложку к тарелке ${i + 1}`}
            >
              {params.scene === 'tea' ? <Emoji code={GUESTS[i % GUESTS.length]} size={72} /> : <Plate />}
            </button>
            <div className="receiver-items">
              {Array.from({ length: n }, (_, k) => (
                <button key={k} className="tap small" onClick={() => takeBack(i)} aria-label="Забрать обратно">
                  <Item size={40} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn primary big"
        disabled={locked || used === 0}
        onClick={() => onSubmit({ correct: given.every((n) => n === 1), answer: given.join(',') })}
      >
        Готово
      </button>
    </div>
  );
}
