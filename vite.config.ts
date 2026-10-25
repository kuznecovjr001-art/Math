import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // Рабочие копии агентов (.claude/worktrees) и Android-сборка — не тесты этого дерева.
  test: { environment: 'node', exclude: [...configDefaults.exclude, '.claude/**', 'android/**'] },
});
