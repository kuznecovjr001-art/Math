import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { FIXED_PHRASES } from './audio/phrases';
import { phraseKey } from './audio/phraseKey';
import { allArtUrls } from './content/art';
import '@fontsource-variable/nunito';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        const loaded = performance.getEntriesByType('resource').map((e) => e.name);
        reg.active?.postMessage({ type: 'cache-urls', urls: loaded });
        // Рисунки остальных островов и сцен докачиваются в фоне, чтобы игра работала без сети.
        // Постоянные фразы тоже: «Получилось!» и «Давай проверим ещё раз» звучат в каждой миссии.
        const voice = FIXED_PHRASES.map((t) => `${import.meta.env.BASE_URL}audio/${phraseKey(t)}.mp3`);
        const art = [...allArtUrls(), ...voice].map((u) => new URL(u, location.href).href);
        setTimeout(() => reg.active?.postMessage({ type: 'cache-urls', urls: art }), 4000);
      })
      .catch(() => {
        // Без service worker приложение работает, только не офлайн.
      });
  });
}
