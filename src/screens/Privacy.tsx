import { createElement, useEffect, useState, type ReactNode } from 'react';
import { Icon, SceneBg } from '../ui/art';

/** Заголовки, абзацы и списки из <main> как React-элементы — только текст, без разметки из файла. */
function toNodes(main: Element | null): ReactNode[] {
  if (!main) return [];
  return [...main.children].map((el, i) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'ul') return <ul key={i}>{[...el.children].map((li, j) => <li key={j}>{li.textContent}</li>)}</ul>;
    return createElement(['h1', 'h2'].includes(tag) ? tag : 'p', { key: i }, el.textContent);
  });
}

/** Политика конфиденциальности внутри приложения: тот же файл, что публикуется для карточки RuStore (public/privacy.html). */
export function Privacy({ onBack }: { onBack: () => void }) {
  const [nodes, setNodes] = useState<ReactNode[] | null>(null);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}privacy.html`)
      .then((r) => r.text())
      .then((t) => setNodes(toNodes(new DOMParser().parseFromString(t, 'text/html').querySelector('main'))))
      .catch(() => setNodes([<p key="e">Не удалось открыть текст политики.</p>]));
  }, []);
  return (
    <div className="screen parent">
      <SceneBg name="parent" />
      <header className="parent-bar">
        <button className="btn" onClick={onBack}><Icon name="back" size={28} />Назад</button>
      </header>
      <section className="card" aria-busy={nodes === null}>{nodes}</section>
    </div>
  );
}
