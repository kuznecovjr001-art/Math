import { customArt } from '../content/art';
import TIPS from '../content/handTips.json';
import type { CardParams } from '../content/missions';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'fingers' }>;

/**
 * Нарисованная ладошка (art-src/hand → assets/art/hand): ладонь к зрителю, большой палец наружу —
 * у первой руки слева (правая рука), у второй справа (левая). Подписи — над кончиками поднятых пальцев.
 */
function DrawnHand({ src, up, tips, labels, from }: { src: string; up: number; tips: number[][]; labels: boolean; from: number }) {
  return (
    <div className="hand drawn" role="img" aria-label={`Поднято пальцев: ${up}`}>
      <img src={src} alt="" draggable={false} />
      {labels && tips.map(([x, y], i) => (
        <span key={i} className="finger-label" style={{ left: `${x}%`, top: `${y}%` }}>{from + i + 1}</span>
      ))}
    </div>
  );
}

/** Рука: up пальцев поднято, остальные загнуты и видны на ладони. Есть рисунок — ладошка, нет — схема. */
function Hand({ up, mirror, labels, from }: { up: number; mirror: boolean; labels: boolean; from: number }) {
  const name = `hand-${mirror ? 'left' : 'right'}-${up}`;
  const src = customArt(`hand/${name}`);
  if (src) return <DrawnHand src={src} up={up} tips={(TIPS as Record<string, number[][]>)[name] ?? []} labels={labels} from={from} />;
  return <SchemeHand up={up} mirror={mirror} labels={labels} from={from} />;
}

/** Схема руки: пальцы поднимаются от большого. Запасной вид, пока нет рисунка. */
function SchemeHand({ up, mirror, labels, from }: { up: number; mirror: boolean; labels: boolean; from: number }) {
  const xs = [32, 52, 72, 92];
  const skin = '#f6c99b';
  const fold = '#d9925a';
  const line = '#7a4a1f';
  const label = (x: number, y: number, n: number) => labels && (
    <text x={x} y={y} textAnchor="middle" fontSize="13" fontWeight="800" fill="#118ab2"
      transform={mirror ? `translate(${2 * x} 0) scale(-1 1)` : undefined}>{n}</text>
  );
  return (
    <svg width="124" height="150" viewBox="0 0 124 150" className="hand" aria-label={`Поднято пальцев: ${up}`}>
      <g transform={mirror ? 'translate(124 0) scale(-1 1)' : undefined}>
        {/* Поднятые пальцы рисуются за ладонью. */}
        {xs.map((x, i) => i + 1 <= up - 1
          ? <rect key={i} x={x} y={10} width="18" height="80" rx="9" fill={skin} stroke={line} strokeWidth="2.5" />
          : null)}
        {up >= 1 && (
          <rect x="12" y="60" width="18" height="54" rx="9" fill={skin} stroke={line} strokeWidth="2.5" transform="rotate(-18 21 112)" />
        )}
        <rect x="26" y="66" width="90" height="74" rx="18" fill={skin} stroke={line} strokeWidth="2.5" />
        {/* Загнутые пальцы видны костяшками поверх ладони. */}
        {xs.map((x, i) => (i + 1 <= up - 1 ? null
          : <rect key={i} x={x} y={72} width="18" height="30" rx="9" fill={fold} stroke={line} strokeWidth="2.5" />))}
        {up < 1 && <rect x="34" y="106" width="44" height="16" rx="8" fill={fold} stroke={line} strokeWidth="2.5" />}
        {up >= 1 && label(14, 76, from + 1)}
        {xs.map((x, i) => (i + 1 <= up - 1 ? <g key={i}>{label(x + 9, 28, from + i + 2)}</g> : null))}
      </g>
    </svg>
  );
}

export function FingersGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const folded = params.total - params.up;
  const first = Math.min(params.up, 5);
  return (
    <div className="game">
      <div className="hands">
        <Hand up={first} mirror={false} labels={help >= 2} from={0} />
        {params.total === 10 && <Hand up={params.up - first} mirror labels={help >= 2} from={5} />}
      </div>
      {help >= 3 && <div className="sum-hint">{params.total} = {params.up} + ?</div>}
      <Choices
        options={answerChoices(folded, 0)}
        render={(n) => <NumberTile n={n} />}
        disabled={locked}
        onPick={(n) => onSubmit({ correct: n === folded, answer: String(n) })}
      />
    </div>
  );
}
