import { writeFileSync } from 'node:fs';
import { configDefaults, defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** Страница сборки Счётика (/#rig) сохраняет раскладку рига в файл. Только dev-сервер, только этот файл. */
const rigSave: Plugin = {
  name: 'rig-save',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__rig-save', (req, res) => {
      // Только страница самого dev-сервера: JSON-тип требует CORS-preflight, Origin должен совпадать с хостом.
      const origin = req.headers.origin;
      const sameOrigin = !origin || new URL(origin).host === req.headers.host;
      if (req.method !== 'POST' || !sameOrigin || !req.headers['content-type']?.startsWith('application/json')) {
        res.statusCode = 403; res.end(); return;
      }
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 200_000) req.destroy(); });
      req.on('end', () => {
        try {
          const rig = JSON.parse(body) as Record<string, any>;
          const id = /^[a-zA-Z0-9_-]+$/;
          const ok = rig && typeof rig === 'object' && Object.entries(rig).every(([k, n]) =>
            id.test(k) && [n.x, n.y, n.rot, n.s, n.z].every(Number.isFinite)
            && (n.parent === undefined || (typeof n.parent === 'string' && n.parent in rig))
            && (n.parts === undefined || (Array.isArray(n.parts) && n.parts.every((p: unknown) => typeof p === 'string' && id.test(p)))));
          if (!ok) throw new Error('bad rig');
          // Пишем пересобранный объект, а не присланный текст.
          writeFileSync(new URL('./src/motion/rig/rig.json', import.meta.url),
            `{\n${Object.entries(rig).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n}\n`);
          res.end('ok');
        } catch {
          res.statusCode = 400;
          res.end('bad rig');
        }
      });
    });
  },
};

export default defineConfig({
  plugins: [react(), rigSave],
  // gsap грузится в отдельном чанке рига: без этого dev-сервер находит его на лету и перезагружает страницу.
  optimizeDeps: { include: ['gsap'] },
  base: './',
  // Рабочие копии агентов (.claude/worktrees) и Android-сборка — не тесты этого дерева.
  test: { environment: 'node', exclude: [...configDefaults.exclude, '.claude/**', 'android/**', 'e2e/**'] },
});
