import { useMemo, useState } from 'react';
import { Icon, SceneBg } from '../ui/art';

/** Простой барьер от случайного входа ребёнка. Это не защита данных. */
export function ParentGate({ onPass, onBack }: { onPass: () => void; onBack: () => void }) {
  const [a, b] = useMemo(() => [6 + Math.floor(Math.random() * 4), 6 + Math.floor(Math.random() * 4)], []);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  const press = (d: string) => {
    setWrong(false);
    setValue((v) => (v + d).slice(0, 3));
  };
  const check = () => {
    if (Number(value) === a * b) onPass();
    else {
      setWrong(true);
      setValue('');
    }
  };

  return (
    <div className="screen gate">
      <SceneBg name="parent" />
      <h1>Для взрослых</h1>
      <p className="lead">Чтобы открыть отчёт и настройки, решите пример.</p>
      <div className="gate-q">{a} × {b} = <span className="gate-value">{value || '?'}</span></div>
      {wrong && <p className="error" role="alert">Не совсем. Попробуйте ещё раз.</p>}
      <div className="keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className="btn key" onClick={() => press(d)}>{d}</button>
        ))}
        <button className="btn key" onClick={() => setValue('')} aria-label="Стереть"><Icon name="erase" size={32} /></button>
        <button className="btn key" onClick={() => press('0')}>0</button>
        <button className="btn key primary" onClick={check} aria-label="Проверить">OK</button>
      </div>
      <button className="btn" onClick={onBack}><Icon name="back" size={28} />Назад</button>
    </div>
  );
}
