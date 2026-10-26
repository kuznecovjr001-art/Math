import { useEffect, useState, type ReactNode } from 'react';
import { sfx } from '../audio/sfx';

/**
 * Ряд крупных кнопок-ответов. Нажатая кнопка остаётся яркой и обведённой, пока плеер проверяет ответ,
 * остальные приглушаются — ребёнок видит, что выбрал. После «давай проверим ещё раз» выбор снимается.
 */
export function Choices<T extends string | number>({
  options, render, disabled, onPick, label,
}: {
  options: T[];
  render: (o: T) => ReactNode;
  disabled: boolean;
  onPick: (o: T) => void;
  label?: (o: T) => string;
}) {
  const [picked, setPicked] = useState<T | null>(null);
  useEffect(() => { if (!disabled) setPicked(null); }, [disabled]);
  return (
    <div className="choices">
      {options.map((o) => (
        <button
          key={o}
          className={`btn choice ${picked === o ? 'picked' : ''}`}
          disabled={disabled}
          aria-pressed={picked === o}
          onClick={() => { sfx.pop(); setPicked(o); onPick(o); }}
          aria-label={label?.(o)}
        >
          {render(o)}
        </button>
      ))}
    </div>
  );
}
