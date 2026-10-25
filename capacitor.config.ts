import type { CapacitorConfig } from '@capacitor/cli';

// appId нельзя сменить после первой публикации в RuStore: владелец подтверждает его до загрузки.
const config: CapacitorConfig = {
  appId: 'io.github.kuznecovjr001_art.schitalochka',
  appName: 'Считалочка',
  webDir: 'dist',
  backgroundColor: '#ffe8b3',
  android: {
    // Отладка WebView через adb только в debug-сборке.
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover', style: 'LIGHT' },
  },
};

export default config;
