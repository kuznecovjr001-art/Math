import { useEffect, useState } from 'react';
import { sfx } from '../audio/sfx';
import type { CardParams } from '../content/missions';
import { Emoji, Person } from '../ui/art';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'seats' }>;

export function SeatsGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [seated, setSeated] = useState<boolean[]>(() => Array(params.total).fill(false));
  const added = seated.filter(Boolean).length;
  const free = params.total - params.taken;

  const toggle = (i: number) => {
    if (locked) return;
    if (seated[i]) sfx.back();
    else sfx.pop();
    setSeated((s) => s.map((x, j) => (j === i ? !x : x)));
  };

  useEffect(() => {
    if (help !== 3) return;
    setSeated((s) => {
      const i = s.findIndex((x, j) => j >= params.taken && !x);
      return i < 0 ? s : s.map((x, j) => (j === i ? true : x));
    });
  }, [help, params.taken]);

  let freeNo = 0;
  return (
    <div className="game">
      <div className="train">
        <div className="train-head"><Emoji code="1F686" size={84} label="Поезд" /></div>
        <div className="seats">
          {seated.map((on, i) => {
            if (i < params.taken) {
              return (
                <div key={i} className="seat taken" aria-label="Место занято">
                  <Person color="red" />
                </div>
              );
            }
            freeNo += 1;
            return (
              <button
                key={i}
                className={`seat tap ${on ? 'filled' : 'free'} ${help >= 2 && !on ? 'attention' : ''}`}
                onClick={() => toggle(i)}
                aria-label={on ? 'Пассажир сел. Нажми, чтобы встал' : 'Свободное место'}
              >
                {on ? <Person color="blue" /> : <span className="seat-empty" />}
                {help >= 2 && <span className="badge">{freeNo}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <button
        className="btn primary big"
        disabled={locked || added === 0}
        onClick={() => onSubmit({ correct: added === free, answer: String(added) })}
      >
        Готово
      </button>
    </div>
  );
}
