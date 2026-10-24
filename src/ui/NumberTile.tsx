/** Плитка ответа: цифра и точки, чтобы ребёнок, не знающий цифр, мог ответить количеством. */
export function NumberTile({ n }: { n: number }) {
  return (
    <span className="tile">
      <span className="tile-digit">{n}</span>
      <span className="tile-dots" aria-hidden="true">
        {Array.from({ length: n }, (_, i) => <i key={i} />)}
      </span>
    </span>
  );
}
