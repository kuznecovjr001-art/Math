import { useState } from 'react';
import { useDragToZone } from '../motion/drag';
import { sfx } from '../audio/sfx';
import type { CardParams } from '../content/missions';
import { Emoji } from '../ui/art';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'sort' }>;

/** Предметы по одному раскладываются в две корзины; ошибку ребёнок исправляет сам. */
export function SortGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [placed, setPlaced] = useState<(0 | 1 | null)[]>(() => params.items.map(() => null));
  const next = placed.indexOf(null);
  const current = next >= 0 ? params.items[next] : null;

  const drop = (bin: 0 | 1) => {
    if (locked || next < 0) return;
    sfx.pop();
    setPlaced((p) => p.map((x, i) => (i === next ? bin : x)));
  };
  const back = (i: number) => {
    if (locked) return;
    sfx.back();
    setPlaced((p) => p.map((x, j) => (j === i ? null : x)));
  };
  const drag = useDragToZone((bin) => drop(bin as 0 | 1), locked || !current);
  const check = () => {
    const wrong = params.items.filter((it, i) => placed[i] !== it.bin).map((it) => it.name);
    onSubmit({ correct: wrong.length === 0, answer: wrong.length ? `не туда: ${wrong.join(', ')}` : 'всё по группам' });
  };

  return (
    <div className="game">
      <div className="sort-current">
        {current
          // Предмет можно перетащить пальцем в корзину или нажать на корзину — как удобнее ребёнку.
          ? <span key={next} className="drag-item" {...drag}><Emoji code={current.icon} size={96} label={current.name} /></span>
          : <span className="stock-empty">Всё разложено</span>}
      </div>
      <div className="bins">
        {params.bins.map((b, bi) => (
          <div key={bi} className="bin" data-drop-zone={bi}>
            <button className="btn bin-btn" disabled={locked || !current} onClick={() => drop(bi as 0 | 1)}>
              <Emoji code={b.icon} size={40} /> {b.title}
            </button>
            <div className="bin-items">
              {params.items.map((it, i) => placed[i] === bi && (
                <button
                  key={i}
                  className={`tap small ${help >= 2 && it.bin !== bi ? 'attention' : ''}`}
                  onClick={() => back(i)}
                  disabled={locked}
                  aria-label={`Вернуть: ${it.name}`}
                >
                  <Emoji code={it.icon} size={44} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {!current && (
        <button className="btn primary big" disabled={locked} onClick={check}>Готово</button>
      )}
    </div>
  );
}
