import type { CSSProperties } from 'react';
import { expectedAnswer, type CardParams } from '../content/missions';
import { tenChoices } from '../content/numbers';
import { NumberChoices } from './NumberChoices';
import { useSolved, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'complete100' }>;

/** Сотня клеток, часть закрашена. Сколько не хватает до 100: сначала до круглого, потом десятками. */
export function Complete100Game({ params, help, locked, onSubmit }: GameProps<P>) {
  const answer = expectedAnswer(params);
  const [solved, submit] = useSolved(onSubmit, 1500);
  const toRound = (10 - (params.n % 10)) % 10;
  return (
    <div className="game">
      <div className="more-scene grid100" role="img" aria-label={`Закрашено ${params.n} клеток из 100`}>
        {Array.from({ length: 100 }, (_, i) => {
          const fill = i < params.n;
          const gap = !fill && help >= 2 && i < params.n + toRound;
          // После верного ответа недостающие клетки заливаются другим цветом — до полной сотни.
          return <span key={i} className={`g100 ${fill ? 'on' : ''} ${gap ? 'gap' : ''} ${!fill && solved ? 'add' : ''}`}
            style={!fill && solved ? ({ '--k': i - params.n } as CSSProperties) : undefined} />;
        })}
      </div>
      {(help >= 3 || solved) && <div className="sum-hint">{toRound > 0 ? `${toRound} до ${params.n + toRound}, ` : ''}ещё {100 - params.n - toRound} до 100</div>}
      <NumberChoices options={tenChoices(answer, 1, 99)} answer={answer} locked={locked} onSubmit={submit} />
    </div>
  );
}
