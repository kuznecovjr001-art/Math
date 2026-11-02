import { ITEMS, type CardParams } from '../content/missions';
import { Emoji } from '../ui/art';
import { Choices } from './Choices';
import { useSolved, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'compare' }>;
type Pick = 'top' | 'bottom' | 'equal';

const LABEL: Record<Pick, string> = { top: 'Сверху больше', bottom: 'Снизу больше', equal: 'Поровну' };

export function CompareGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, submit] = useSolved(onSubmit);
  const item = ITEMS[params.item];
  const right: Pick = params.top > params.bottom ? 'top' : params.top < params.bottom ? 'bottom' : 'equal';
  // Ступень 2: составляем пары — ряды выравниваются один под другим.
  const paired = help >= 2;
  const row = (n: number, spread: boolean, other: number) => (
    <div className={`compare-row ${spread && !paired ? 'spread' : 'tight'}`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={`compare-cell ${paired && i >= other ? 'unpaired' : ''}`}>
          <Emoji code={item.img} size={spread && !paired ? 52 : 44} />
        </span>
      ))}
    </div>
  );
  return (
    <div className="game">
      <div className="compare">
        {row(params.top, params.spreadTop, params.bottom)}
        {row(params.bottom, !params.spreadTop, params.top)}
        {(help >= 3 || solved) && (
          <div className="compare-counts">Сверху {params.top}, снизу {params.bottom}</div>
        )}
      </div>
      <Choices<Pick>
        options={['top', 'equal', 'bottom']}
        render={(o) => <span className="choice-text">{o === 'top' ? '⬆ ' : o === 'bottom' ? '⬇ ' : '= '}{LABEL[o]}</span>}
        disabled={locked}
        onPick={(o) => submit({ correct: o === right, answer: LABEL[o] })}
      />
    </div>
  );
}
