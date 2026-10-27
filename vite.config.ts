import { writeFileSync } from 'node:fs';
import { configDefaults, defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** Страница сборки Счётика (/#rig) сохраняет раскладку рига в файл. Только dev-сервер, только этот файл. */
const rigSave: Plugin = {
  name: 'rig-save',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__rig-save', (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        try {
          const rig = JSON.parse(body);
          const ok = rig && typeof rig === 'object' && Object.values(rig).every((n: any) => [n.x, n.y, n.rot, n.s, n.z].every(Number.isFinite));
          if (!ok) throw new Error('bad rig');
          writeFileSync(new URL('./src/motion/rig/rig.json', import.meta.url), body);
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
