import { memo, useId } from 'react';
import { childrenOf, nodeTransform, variantTransform, type Parts, type Rig } from './model';

export const INK = '#3D2C00';
const STRAP = '#D4A373';
/** Ремень сумки рисуем сами: на листе он петлёй, а на груди нужен по диагонали. Длина 300 при s = 1. */
const STRAP_LEN = 300;
/** Квадрат вокруг фигуры в покое (y 60…950) с запасом на прыжок. */
const FIGURE = '47 35 930 930';

/**
 * Ласт черепашки (правый со стороны зрителя; левый — зеркало). Шарнир — плечо в (0, 0), ласт висит вниз
 * и чуть наружу. Цвета и толщина обводки — как у ног на листе деталей (стиль-ключ v2).
 */
const FLIPPER = 'M-48 -6 C-50 -42 52 -42 54 -8 C76 44 106 112 101 182 C97 246 80 300 44 313 C13 323 -13 300 -19 268 C-27 208 -37 118 -48 -6 Z';
function Flipper({ clip }: { clip: string }) {
  return (
    <>
      <clipPath id={clip}><path d={FLIPPER} /></clipPath>
      <path d={FLIPPER} fill="#94D7AE" />
      <g clipPath={`url(#${clip})`} fill="#74C3A0">
        <path d="M-60 -10 C-40 120 -20 230 10 330 L-60 330 Z" />
        <ellipse cx={52} cy={92} rx={15} ry={22} />
        <ellipse cx={66} cy={176} rx={13} ry={18} />
        <ellipse cx={36} cy={254} rx={11} ry={14} />
      </g>
      <path d={FLIPPER} fill="none" stroke={INK} strokeWidth={13} strokeLinejoin="round" />
    </>
  );
}

interface Props {
  rig: Rig;
  parts: Parts;
  /** Какой вариант детали виден у узла (по умолчанию первый). */
  shown?: Record<string, string>;
  className?: string;
  /** Страница сборки — весь холст 1024 (как образцы поз); в игре — по фигуре, чтобы Счётик был крупнее. */
  viewBox?: string;
}

/**
 * Статичный SVG рига: структура рисуется один раз, а движение (motion/rig/animate) меняет атрибуты transform
 * и display напрямую, без перерисовки React. Узел — <g data-node>, вариант рисунка — <g data-v>,
 * зрачок открытого глаза — <g data-pupil> (его двигает взгляд).
 */
export const RigSvg = memo(function RigSvg({ rig, parts, shown = {}, className, viewBox = FIGURE }: Props) {
  // id для clipPath: useId даёт «r0» или :r0:, в url(#…) оставляем только безопасные символы.
  const uid = `rig${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const node = (id: string): React.ReactNode => {
    const n = rig[id];
    const on = shown[id] ?? n.parts?.[0];
    return (
      <g key={id} data-node={id} transform={nodeTransform(n)}>
        {(n.parts ?? []).map((name) => {
          const display = name === on ? undefined : 'none';
          if (name === 'flipper-L' || name === 'flipper-R') {
            return (
              <g key={name} data-v={name} display={display} transform={name === 'flipper-L' ? 'scale(-1 1)' : undefined}>
                <Flipper clip={`${uid}-${id}`} />
              </g>
            );
          }
          if (name === 'strap') {
            const d = `M0 0 L${STRAP_LEN} 0`;
            return (
              <g key={name} data-v={name} display={display}>
                <path d={d} stroke={INK} strokeWidth={30} strokeLinecap="round" fill="none" />
                <path d={d} stroke={STRAP} strokeWidth={18} strokeLinecap="round" fill="none" />
              </g>
            );
          }
          const p = parts[name];
          const clip = `${uid}-${id}-${name}`;
          return (
            <g key={name} data-v={name} display={display} transform={variantTransform(n, name, p)}>
              {/* Пути — из нашего же parts.json (scripts/art/rig_parts.py), не из ввода пользователя. */}
              <g dangerouslySetInnerHTML={{ __html: p.svg }} />
              {p.pupil && p.clip && p.shine && (
                <>
                  <clipPath id={clip}><ellipse cx={p.clip[0]} cy={p.clip[1]} rx={p.clip[2]} ry={p.clip[3]} /></clipPath>
                  <g clipPath={`url(#${clip})`}>
                    <g data-pupil="">
                      <ellipse cx={p.pupil[0]} cy={p.pupil[1]} rx={p.pupil[2]} ry={p.pupil[3]} fill={INK} />
                      <circle cx={p.shine[0]} cy={p.shine[1]} r={p.shine[2]} fill="#fff" />
                    </g>
                  </g>
                </>
              )}
            </g>
          );
        })}
        {childrenOf(rig, id).map(node)}
      </g>
    );
  };
  return (
    <svg className={className} viewBox={viewBox} aria-hidden="true" focusable="false">
      {childrenOf(rig, undefined).map(node)}
    </svg>
  );
});
