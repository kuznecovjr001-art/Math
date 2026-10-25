import { useState } from 'react';
import { expectedAnswer, type CardParams } from '../content/missions';
import { customArt } from '../content/art';
import { NumberChoices } from './NumberChoices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'units' }>;

const UNIT_PX = { clip: 36, pencil: 46 };

function Unit({ unit }: { unit: P['unit'] }) {
  const own = customArt(unit === 'clip' ? 'item/paperclip' : 'item/pencil');
  const w = UNIT_PX[unit];
  if (own) return <img src={own} width={w} height={w / 2} alt="" aria-hidden="true" style={{ objectFit: 'contain' }} />;
  return unit === 'clip' ? (
    <svg width={w} height={18} viewBox="0 0 36 18" aria-hidden="true">
      <path d="M4 9a5 5 0 0 1 5-5h20a4 4 0 0 1 0 8H11a2 2 0 0 1 0-4h16" fill="none" stroke="#5c6b7a" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width={w} height={18} viewBox="0 0 46 18" aria-hidden="true">
      <rect x={1} y={4} width={34} height={10} rx={2} fill="#f6bd60" stroke="#7a4a1f" strokeWidth="1.5" />
      <path d="M35 4l9 5-9 5z" fill="#ffe0b5" stroke="#7a4a1f" strokeWidth="1.5" />
      <rect x={1} y={4} width={5} height={10} fill="#e76f51" />
    </svg>
  );
}

/** Мерка: ребёнок прикладывает скрепки или карандаши вдоль ленты встык и считает их. */
export function UnitsGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  const [laid, setLaid] = useState(0);
  const shown = help >= 2 ? params.len : laid;
  const w = UNIT_PX[params.unit] * params.len;
  return (
    <div className="game">
      <div className="more-scene units-scene">
        <div className="units-ribbon" style={{ width: w }} />
        <div className="units-row" style={{ width: w }}>
          {Array.from({ length: shown }, (_, i) => (
            <span key={i} className="unit-cell">
              <Unit unit={params.unit} />
              {help >= 3 && <span className="unit-n">{i + 1}</span>}
            </span>
          ))}
        </div>
        <button
          className="btn lay"
          disabled={locked || shown >= params.len}
          onClick={() => setLaid(laid + 1)}
          aria-label={params.unit === 'clip' ? 'Приложить скрепку' : 'Приложить карандаш'}
        >
          <Unit unit={params.unit} /> +
        </button>
      </div>
      <NumberChoices options={answerChoices(answer)} answer={answer} locked={locked} onSubmit={onSubmit} />
    </div>
  );
}
