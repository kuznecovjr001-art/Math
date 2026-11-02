import type { CSSProperties } from 'react';
import { customArt } from '../content/art';
import life from '../content/mapLife.json';

type Box = [number, number, number, number];
interface Layer { sparkles: number[][]; parts?: Record<string, Box> }
const LIFE = life as unknown as Record<string, Record<'land' | 'port', Layer>>;

/** Как движется деталь: ротор крутится вокруг ступицы, флажок колышется от древка, лодка покачивается. */
const MOTION: Record<string, string> = { rotor: 'life-spin', 'flag-lilac': 'life-flag', 'flag-green': 'life-flag', boat: 'life-bob' };

/** Облако: плоская заливка с мягкой тенью снизу, как в стиль-ключе. */
function Cloud() {
  return (
    <svg viewBox="0 0 120 50" aria-hidden="true">
      <path d="M14 44 C2 44 2 28 16 28 C16 14 36 10 44 20 C50 6 76 6 80 22 C92 14 112 22 104 36 C116 40 110 46 100 46 Z" fill="#fff" />
      <path d="M8 40 C30 46 80 48 110 42 C108 46 104 47 100 47 L14 46 C10 46 8 44 8 40 Z" fill="#e3eef2" />
    </svg>
  );
}

/**
 * Живой слой над рисунком острова (под камнями): облака, блики на воде и детали, снятые с подложки
 * (scripts/art/maps.py). Только transform и opacity. Когда движение выключено, детали стоят на месте,
 * а облаков и бликов нет (motion.css). Слой не ловит касаний.
 */
export function MapLife({ island }: { island: string }) {
  const data = LIFE[island];
  if (!data) return null;
  return (
    <li className="map-life" aria-hidden="true">
      {(['land', 'port'] as const).map((o) => (
        <div key={o} className={`life-${o}`}>
          {data[o].sparkles.map(([x, y], i) => (
            <span key={i} className={i % 3 === 2 ? 'life-wave' : 'life-glint'}
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-i * 0.9}s` } as CSSProperties} />
          ))}
          {Object.entries(data[o].parts ?? {}).map(([name, [x, y, w, h]]) => {
            const src = customArt(`maplife/${name}`);
            return src && (
              <img key={name} src={src} alt="" draggable={false} className={`life-part ${MOTION[name]}`}
                style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }} />
            );
          })}
          {/* Облака — только по верхней кромке: ниже стоят камни миссий, их нельзя закрывать. */}
          <div className="life-cloud" style={{ top: '1%' }}><Cloud /></div>
          <div className="life-cloud slow" style={{ top: '5%' }}><Cloud /></div>
        </div>
      ))}
    </li>
  );
}
