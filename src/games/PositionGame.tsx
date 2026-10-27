import { useLayoutEffect, useRef, useState } from 'react';
import { sfx } from '../audio/sfx';
import { WHERE_LABEL, WHERE_TEXT, type CardParams, type Where } from '../content/missions';
import { flyFrom } from '../motion/flight';
import { Emoji } from '../ui/art';
import type { GameProps } from './types';

type P = Extract<CardParams, { kind: 'position' }>;

/** Зоны сцены в процентах от размеров сцены 360 × 230. */
const ZONES: Record<Where, { left: number; top: number; width: number; height: number }> = {
  on: { left: 4, top: 6, width: 44, height: 38 },
  under: { left: 10, top: 54, width: 32, height: 38 },
  in: { left: 56, top: 50, width: 26, height: 44 },
  next: { left: 83, top: 50, width: 16, height: 44 },
};

const ORDER: Where[] = ['on', 'under', 'in', 'next'];

/**
 * Стол и открытая коробка; котёнок ждёт рядом со сценой, и его сажают туда, куда сказали:
 * по касанию он перепрыгивает из ожидания (или с прошлого места) в выбранную зону.
 */
export function PositionGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [cat, setCat] = useState<Where | null>(null);
  const from = useRef<DOMRect | null>(null);
  const scene = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (cat && from.current) flyFrom(scene.current?.querySelector('.zone .cat'), from.current);
    from.current = null;
  }, [cat]);
  const put = (w: Where) => {
    if (locked) return;
    sfx.pop();
    from.current = scene.current?.parentElement?.querySelector('.cat')?.getBoundingClientRect() ?? null;
    setCat(w);
    onSubmit({ correct: w === params.where, answer: WHERE_TEXT[w] });
  };
  return (
    <div className="game">
      <div className="cat-wait" aria-hidden="true">{!cat && <span className="cat"><Emoji code="1F431" size={52} /></span>}</div>
      <div className="position-scene" ref={scene}>
        <svg viewBox="0 0 360 230" className="position-art" aria-hidden="true">
          <rect x="12" y="104" width="166" height="14" rx="4" fill="#b07d48" stroke="#5c3b17" strokeWidth="3" />
          <rect x="24" y="118" width="12" height="94" fill="#b07d48" stroke="#5c3b17" strokeWidth="3" />
          <rect x="154" y="118" width="12" height="94" fill="#b07d48" stroke="#5c3b17" strokeWidth="3" />
          <path d="M200 130 h96 v80 h-96 z" fill="#e9c46a" stroke="#7a5a12" strokeWidth="3" />
          <path d="M200 130 l-14 -18 M296 130 l14 -18" stroke="#7a5a12" strokeWidth="3" />
          <path d="M0 214 H360" stroke="#c9b48a" strokeWidth="4" />
        </svg>
        {ORDER.map((w) => {
          const z = ZONES[w];
          return (
            <button
              key={w}
              className={`zone ${help >= 3 && w === params.where ? 'attention' : ''}`}
              style={{ left: `${z.left}%`, top: `${z.top}%`, width: `${z.width}%`, height: `${z.height}%` }}
              disabled={locked}
              onClick={() => put(w)}
              aria-label={WHERE_TEXT[w]}
            >
              {cat === w && <span className="cat"><Emoji code="1F431" size={52} /></span>}
              {help >= 2 && cat !== w && <span className="zone-label">{WHERE_LABEL[w]}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
