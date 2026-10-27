import type { CSSProperties, ReactNode } from 'react';
import { artSrc, customArt } from '../content/art';
import { SCENE_FALLBACK } from '../content/scenes';

/** Картинки OpenMoji (CC BY-SA 4.0) или свои рисунки из src/assets/art, и простые нарисованные предметы. */

export function Emoji({ code, size = 56, label }: { code: string; size?: number; label?: string }) {
  return (
    <img
      src={artSrc(code)}
      width={size}
      height={size}
      alt={label ?? ''}
      draggable={false}
      className="emoji"
    />
  );
}

/** Рисунок из src/assets/art (item/cup, char/passenger-new), а без него — простая SVG-заглушка. */
function Drawn({ path, size, children }: { path: string; size: number; children: ReactNode }) {
  const own = customArt(path);
  return own ? <img src={own} width={size} height={size} alt="" draggable={false} aria-hidden="true" /> : <>{children}</>;
}

export function Cup({ size = 44 }: { size?: number }) {
  return (
    <Drawn path="item/cup" size={size}>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 16h26v12a11 11 0 0 1-11 11h-4A11 11 0 0 1 8 28z" fill="#f4a261" stroke="#7a4a1f" strokeWidth="2.5" />
        <path d="M34 19h3a5 5 0 0 1 0 10h-3" fill="none" stroke="#7a4a1f" strokeWidth="2.5" />
        <path d="M5 42h34" stroke="#7a4a1f" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </Drawn>
  );
}

export function Spoon({ size = 44 }: { size?: number }) {
  return (
    <Drawn path="item/spoon" size={size}>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <ellipse cx="24" cy="12" rx="7" ry="9" fill="#cfd8dc" stroke="#546e7a" strokeWidth="2.5" />
        <path d="M24 21v22" stroke="#546e7a" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </Drawn>
  );
}

export function Plate({ size = 72 }: { size?: number }) {
  return (
    <Drawn path="item/plate" size={size}>
      <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r="32" fill="#ffffff" stroke="#90a4ae" strokeWidth="3" />
        <circle cx="36" cy="36" r="21" fill="none" stroke="#cfd8dc" strokeWidth="2.5" />
      </svg>
    </Drawn>
  );
}

export function Parcel({ size = 48 }: { size?: number }) {
  return (
    <Drawn path="item/parcel" size={size}>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <rect x="5" y="10" width="38" height="32" rx="4" fill="#d4a373" stroke="#7f5539" strokeWidth="2.5" />
        <path d="M5 20h38M24 10v32" stroke="#7f5539" strokeWidth="2.5" />
      </svg>
    </Drawn>
  );
}

export function Person({ color, size = 48 }: { color: 'red' | 'blue'; size?: number }) {
  const fill = color === 'red' ? '#e76f51' : '#3a86ff';
  const stroke = color === 'red' ? '#9c3d24' : '#1d4fa8';
  return (
    <Drawn path={color === 'red' ? 'char/passenger-seated' : 'char/passenger-new'} size={size}>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="14" r="9" fill={fill} stroke={stroke} strokeWidth="2.5" />
        <path d="M9 44a15 15 0 0 1 30 0z" fill={fill} stroke={stroke} strokeWidth="2.5" />
      </svg>
    </Drawn>
  );
}

/** Контурные иконки кнопок в стиле ТЗ; рисунок ui/icon-<name> из src/assets/art их заменяет. */
const ICONS = {
  home: <><path d="M8 23 24 9l16 14" /><path d="M13 20v18h22V20" fill="#ffd166" /><path d="M21 38v-9h6v9" /></>,
  sound: <><path d="M8 19h7l9-8v26l-9-8H8z" fill="#ffd166" /><path d="M31 18a8 8 0 0 1 0 12M35 13a15 15 0 0 1 0 22" /></>,
  help: <><path d="M17 31a11 11 0 1 1 14 0v4H17z" fill="#ffd166" /><path d="M19 40h10M21 44h6" /></>,
  back: <path d="M28 12 16 24l12 12" />,
  lock: <><rect x="11" y="21" width="26" height="19" rx="5" fill="#ffd166" /><path d="M16 21v-5a8 8 0 0 1 16 0v5" /></>,
  plus: <path d="M24 10v28M10 24h28" />,
  erase: <><path d="M16 12h24v24H16L6 24z" fill="#ffd166" /><path d="m22 19 10 10M32 19 22 29" /></>,
  star: <path d="m24 7 5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#ffd166" />,
  check: <path d="m10 25 9 9 19-20" />,
  adult: <><circle cx="17" cy="13" r="6" fill="#f0d9a6" /><path d="M7 41a10 12 0 0 1 20 0z" fill="#f0d9a6" /><circle cx="34" cy="22" r="5" fill="#f0d9a6" /><path d="M26 41a8 9 0 0 1 16 0z" fill="#f0d9a6" /></>,
  review: <><path d="M38 24a14 14 0 1 1-4-10" /><path d="M36 6v9h-9" /></>,
  turn: <><path d="M12 22a13 13 0 0 1 22-7" /><path d="M35 8v8h-8" /><path d="M36 26a13 13 0 0 1-22 7" /><path d="M13 40v-8h8" /></>,
};
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 36 }: { name: IconName; size?: number }) {
  const own = customArt(`ui/icon-${name}`);
  if (own) return <img src={own} width={size} height={size} alt="" draggable={false} className="emoji" />;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" fill="none"
      stroke="#3d2c00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

/** Фон из src/assets/art/bg/<name>-land и -port, если он уже нарисован; CSS выбирает по ориентации. */
export function bgVars(name: string): CSSProperties | undefined {
  const land = customArt(`bg/${name}-land`);
  const port = customArt(`bg/${name}-port`) ?? land;
  if (!land && !port) return SCENE_FALLBACK[name] ? bgVars(SCENE_FALLBACK[name]) : undefined;
  return { '--bg-land': `url(${land ?? port})`, '--bg-port': `url(${port})` } as CSSProperties;
}

/** Фон всего экрана под содержимым: картинка сцены и светлая вуаль, чтобы текст читался. */
export function SceneBg({ name }: { name: string }) {
  const vars = bgVars(name);
  if (!vars) return null;
  return <div className="scene-bg" style={vars} aria-hidden="true" />;
}

/** Рисунки предметов, которые игры показывают через CSS (салфетка, фишки, палочки): переменные на корне приложения. */
export function artVars(): CSSProperties {
  const vars: Record<string, string> = {};
  for (const name of ['napkin', 'counter-red', 'counter-blue', 'stick', 'band', 'plate', 'box-back']) {
    const src = customArt(`item/${name}`);
    if (src) vars[`--art-${name}`] = `url(${src})`;
  }
  return vars as CSSProperties;
}

/** Картинка к задаче S01 по её сюжету: тюльпаны, карандаши, конфеты, автобус, пакеты. */
const STORY_ART: [RegExp, string][] = [
  [/тюльпан/, 'story-tulips'], [/карандаш/, 'story-pencils'], [/конфет/, 'story-candies'],
  [/пассажир|автобус/, 'story-bus'], [/Маша.*пакет|пакет.*съела/, 'story-masha'], [/пакет/, 'story-bags'],
];
export function storyArt(text: string): string | undefined {
  const hit = STORY_ART.find(([re]) => re.test(text));
  return hit && customArt(`item/${hit[1]}`);
}
