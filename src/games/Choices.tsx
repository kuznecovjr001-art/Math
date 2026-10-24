import type { ReactNode } from 'react';

/** Ряд крупных кнопок-ответов. */
export function Choices<T extends string | number>({
  options, render, disabled, onPick, label,
}: {
  options: T[];
  render: (o: T) => ReactNode;
  disabled: boolean;
  onPick: (o: T) => void;
  label?: (o: T) => string;
}) {
  return (
    <div className="choices">
      {options.map((o) => (
        <button key={o} className="btn choice" disabled={disabled} onClick={() => onPick(o)} aria-label={label?.(o)}>
          {render(o)}
        </button>
      ))}
    </div>
  );
}
