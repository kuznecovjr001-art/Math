import type { CapacitorConfig } from '@capacitor/cli';

// appId нельзя сменить после первой публикации в RuStore: владелец подтверждает его до загрузки.
const config: CapacitorConfig = {
  appId: 'io.github.kuznecovjr001_art.schitalochka',
  appName: 'Считалочка',
  webDir: 'dist',
  backgroundColor: '#ffe8b3',
  // webContentsDebuggingEnabled не задан: Capacitor включает отладку WebView только в debug-сборке (нужна для QA-скрипта).
  plugins: {
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover', style: 'LIGHT' },
  },
};

export default config;
