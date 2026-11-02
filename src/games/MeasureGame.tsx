import { measureAnswer, type CardParams, type Thing } from '../content/missions';
import { Emoji } from '../ui/art';
import { useSolved, type GameProps } from './types';

type P = Extract<CardParams, { kind: 'measure' }>;

const CELL = 34;

/** Длина: ленты, которые сдвинуты друг относительно друга. Масса: весы показывают, что тяжелее. */
export function MeasureGame({ params, help, locked, onSubmit }: GameProps<P>) {
  const [solved, submit] = useSolved(onSubmit);
  const right = measureAnswer(params);
  const pick = (i: number) => submit({ correct: i === right, answer: i === 0 ? 'первое' : 'второе' });
  const isLength = params.attr === 'longer' || params.attr === 'shorter';

  if (isLength) {
    const aligned = help >= 2;
    const width = Math.max(...[params.a, params.b].map((t) => (aligned ? 0 : t.shift ?? 0) + t.len!)) * CELL;
    const ribbon = (t: Thing, i: number) => (
      <button key={i} className="ribbon-row" disabled={locked} onClick={() => pick(i)} aria-label={i === 0 ? 'Верхняя лента' : 'Нижняя лента'}>
        <span
          className={`ribbon r${i}`}
          // Сдвиг — transform, а не margin: выравнивание лент на подсказке не пересчитывает раскладку.
          style={{ transform: `translateX(${(aligned ? 0 : t.shift ?? 0) * CELL}px)`, width: t.len! * CELL }}
        >
          {(help >= 3 || solved) && Array.from({ length: t.len! }, (_, k) => <i key={k} className="ribbon-cell">{k + 1}</i>)}
        </span>
      </button>
    );
    return (
      <div className="game">
        <div className={`ribbons ${aligned ? 'aligned' : ''}`} style={{ width: width + 24 }}>
          {ribbon(params.a, 0)}
          {ribbon(params.b, 1)}
        </div>
      </div>
    );
  }

  // Весы: тяжёлая чаша ниже. Наклон считается по массам, а не по размеру картинки.
  const tilt = Math.sign(params.b.weight! - params.a.weight!) * 12;
  const pan = (t: Thing, i: number) => (
    <button key={i} className={`pan pan${i}`} disabled={locked} onClick={() => pick(i)} aria-label={t.name}>
      <Emoji code={t.icon!} size={t.icon === '1F388' ? 84 : 56} label={t.name} />
      <span className="pan-dish" />
    </button>
  );
  return (
    <div className="game">
      <div className="scale">
        <div className="beam" style={{ transform: `rotate(${tilt}deg)` }}>
          {pan(params.a, 0)}
          {pan(params.b, 1)}
        </div>
        <div className="scale-stand" />
      </div>
      {help >= 2 && <div className="sum-hint">Тяжёлое опускается вниз</div>}
    </div>
  );
}
