import { useState, type CSSProperties } from 'react';
import { PHRASE } from '../audio/phrases';
import { sfx } from '../audio/sfx';
import { ITEMS, type CardParams } from '../content/missions';
import { Emoji } from '../ui/art';
import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';
import { answerChoices, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'array' }>;
type Cmp = 'more' | 'same' | 'less';

const CMP_LABEL: Record<Cmp, string> = { more: 'Стало больше', same: 'Столько же', less: 'Стало меньше' };

function Grid({ rows, cols, labels }: { rows: number; cols: number; labels: boolean }) {
  return (
    <div className="array-grid" style={{ gridTemplateColumns: `repeat(${cols}, auto)${labels ? ' auto' : ''}` }}>
      {Array.from({ length: rows }, (_, r) => [
        // С подсказкой ряды по очереди «вспыхивают»: по cols деревьев, rows раз — структура умножения.
        ...Array.from({ length: cols }, (_, c) => (
          <span key={`${r}-${c}`} className={labels ? 'row-glow' : ''} style={{ '--r': r } as CSSProperties}><Emoji code={ITEMS.tree.img} size={40} /></span>
        )),
        ...(labels ? [<span key={`l${r}`} className="row-label row-glow" style={{ '--r': r } as CSSProperties}>{cols}</span>] : []),
      ])}
    </div>
  );
}

/** Переместительность: сад поворачивают, число деревьев не меняется. */
export function ArrayGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [turned, setTurned] = useState(false);
  const [step, setStep] = useState<'compare' | 'total'>('compare');
  const rows = turned ? params.cols : params.rows;
  const cols = turned ? params.rows : params.cols;
  const total = params.rows * params.cols;
  return (
    <div className="game">
      <div className={`array-scene ${turned ? 'turned' : ''}`}>
        <Grid rows={rows} cols={cols} labels={help >= 2} />
      </div>
      {help >= 3 && (
        <div className="sum-hint">
          {params.cols} × {params.rows} = {params.rows} × {params.cols}
        </div>
      )}
      {!turned ? (
        <button className="btn primary big" disabled={locked} onClick={() => { sfx.pop(); setTurned(true); }}>
          ⟳ Повернуть
        </button>
      ) : step === 'compare' ? (
        <>
          <div className="question">Деревьев стало больше, меньше или столько же?</div>
          <Choices<Cmp>
            options={['more', 'same', 'less']}
            render={(o) => <span className="choice-text">{CMP_LABEL[o]}</span>}
            disabled={locked}
            onPick={(o) => {
              const correct = o === 'same';
              onSubmit({ correct, answer: CMP_LABEL[o], final: false, next: PHRASE.nextTrees });
              if (correct) setStep('total');
            }}
          />
        </>
      ) : (
        <>
          <div className="question">Сколько всего деревьев?</div>
          <Choices
            options={answerChoices(total)}
            render={(n) => <NumberTile n={n} dots={false} />}
            disabled={locked}
            onPick={(n) => onSubmit({ correct: n === total, answer: `итог ${n}` })}
          />
        </>
      )}
    </div>
  );
}
