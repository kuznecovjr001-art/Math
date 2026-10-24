/**
 * Плитка ответа: цифра и точки, чтобы ребёнок, не знающий цифр, мог ответить количеством.
 * Точки выключаются там, где проверяется сама цифра или числа больше десяти.
 */
export function NumberTile({ n, dots = true }: { n: number; dots?: boolean }) {
  return (
    <span className="tile">
      <span className="tile-digit">{n}</span>
      {dots && n <= 10 && (
        <span className="tile-dots" aria-hidden="true">
          {Array.from({ length: n }, (_, i) => <i key={i} />)}
        </span>
      )}
    </span>
  );
}
