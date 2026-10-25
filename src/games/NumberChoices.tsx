import { NumberTile } from '../ui/NumberTile';
import { Choices } from './Choices';

/** Числовые кнопки-ответы без точек: на островах 3–6 числа больше десяти. */
export function NumberChoices({ options, answer, locked, onSubmit }: {
  options: number[];
  answer: number;
  locked: boolean;
  onSubmit: (r: { correct: boolean; answer: string }) => void;
}) {
  return (
    <Choices
      options={options}
      render={(n) => <NumberTile n={n} dots={false} />}
      disabled={locked}
      onPick={(n) => onSubmit({ correct: n === answer, answer: String(n) })}
    />
  );
}
