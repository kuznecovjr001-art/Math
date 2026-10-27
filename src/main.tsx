import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App, preloadScreens } from './App';
import { FIXED_PHRASES } from './audio/phrases';
import { phraseKey } from './audio/phraseKey';
import voiceKeys from './audio/voice-keys.json';
import { allArtUrls } from './content/art';
import { isNative } from './platform/native';
import '@fontsource-variable/nunito';
import './styles.css';
import './motion/motion.css';

// Страница сборки Счётика — только при разработке (/#rig); в сборку приложения не попадает.
const RigStudio = import.meta.env.DEV && location.hash === '#rig' ? lazy(() => import('./motion/rig/Studio')) : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {RigStudio ? <Suspense><RigStudio /></Suspense> : <App />}
  </StrictMode>,
);

// На Android всё уже внутри APK: кэш service worker только мешал бы обновлениям.
if ('serviceWorker' in navigator && import.meta.env.PROD && !isNative) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => Promise.all([navigator.serviceWorker.ready, preloadScreens()]))
      .then(([reg]) => {
        const loaded = performance.getEntriesByType('resource').map((e) => e.name);
        reg.active?.postMessage({ type: 'cache-urls', urls: loaded });
        // Рисунки остальных островов и сцен докачиваются в фоне, чтобы игра работала без сети.
        // Постоянные фразы тоже: «Получилось!» и «Давай проверим ещё раз» звучат в каждой миссии.
        // Постоянные фразы звучат в каждой миссии; остальные записи кэшируются при первом проигрывании.
        const voice = FIXED_PHRASES.map((t) => `${import.meta.env.BASE_URL}voice/${voiceKeys.voice}/${phraseKey(t)}.ogg`);
        const art = [...allArtUrls(), ...voice].map((u) => new URL(u, location.href).href);
        setTimeout(() => reg.active?.postMessage({ type: 'cache-urls', urls: art }), 4000);
      })
      .catch(() => {
        // Без service worker приложение работает, только не офлайн.
      });
  });
}
