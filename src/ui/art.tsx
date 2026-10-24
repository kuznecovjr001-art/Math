/** Картинки OpenMoji (CC BY-SA 4.0) и простые нарисованные предметы. */

export function Emoji({ code, size = 56, label }: { code: string; size?: number; label?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}img/openmoji/${code}.svg`}
      width={size}
      height={size}
      alt={label ?? ''}
      draggable={false}
      className="emoji"
    />
  );
}

export function Cup({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M8 16h26v12a11 11 0 0 1-11 11h-4A11 11 0 0 1 8 28z" fill="#f4a261" stroke="#7a4a1f" strokeWidth="2.5" />
      <path d="M34 19h3a5 5 0 0 1 0 10h-3" fill="none" stroke="#7a4a1f" strokeWidth="2.5" />
      <path d="M5 42h34" stroke="#7a4a1f" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Spoon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <ellipse cx="24" cy="12" rx="7" ry="9" fill="#cfd8dc" stroke="#546e7a" strokeWidth="2.5" />
      <path d="M24 21v22" stroke="#546e7a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Plate({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="32" fill="#ffffff" stroke="#90a4ae" strokeWidth="3" />
      <circle cx="36" cy="36" r="21" fill="none" stroke="#cfd8dc" strokeWidth="2.5" />
    </svg>
  );
}

export function Parcel({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="5" y="10" width="38" height="32" rx="4" fill="#d4a373" stroke="#7f5539" strokeWidth="2.5" />
      <path d="M5 20h38M24 10v32" stroke="#7f5539" strokeWidth="2.5" />
    </svg>
  );
}

export function Person({ color, size = 48 }: { color: 'red' | 'blue'; size?: number }) {
  const fill = color === 'red' ? '#e76f51' : '#3a86ff';
  const stroke = color === 'red' ? '#9c3d24' : '#1d4fa8';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="14" r="9" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <path d="M9 44a15 15 0 0 1 30 0z" fill={fill} stroke={stroke} strokeWidth="2.5" />
    </svg>
  );
}
