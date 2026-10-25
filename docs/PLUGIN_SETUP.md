# Подключения Claude Code для Math

## Сначала проверить уже подключённое
В репозитории в `.claude/settings.json` уже прописаны `superpowers`, `frontend-design`, `feature-dev`, `security-guidance`, `plugin-dev`, `ui-ux-pro-max` и `web-quality-skills`. Это декларация настроек, а не доказательство успешной установки в текущей сессии. Выполнить `/doctor`, `/plugin`, `/mcp` и не дублировать установки.

## Добавить целево, при необходимости
* **GitHub** (официальный MCP-плагин) — issues, PR, review и CI. Подключить с авторизацией владельца.
* **Playwright MCP** — браузерный UI и скриншоты. Официальный путь в CLI: `claude mcp add playwright npx @playwright/mcp@latest` (в CLI компьютера, а не внутри диалога). Отдельно `@playwright/test` для воспроизводимого CI.
* **Context7** — справочник актуальной документации Capacitor/React/Android. Через `npx ctx7 setup --claude` или плагин Context7; выбрать один способ без дублей.
* **PR Review Toolkit** — опционально только при сложных PR; уже есть review в feature-dev/superpowers.

## Не подключать без явной необходимости
Figma MCP — только если есть Figma-макеты. Rive — если реально создаются интерактивные `.riv` исходники. Облачные аналитические SDK, crash-трекеры с персональными данными детей, рекламные SDK, сервисы авторизации и платежей не нужны первому офлайн-релизу.

## Инструменты вне плагинов Claude Code
* Android Studio + Android SDK + adb + Gradle (нативная сборка).
* `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` — Android-каркас. Совместимые версии выбрать из текущей документации.
* `motion` — движения и жесты в React; оценить вес сборки и необходимость.
* Maestro CLI — нативный Android E2E, только когда доступен эмулятор/устройство.
* `vitest`, Playwright Test — unit и web E2E.
* IndexedDB/Dexie либо SQLite — решение storage-engineer после анализа миграции; не устанавливать сразу оба.

## Экономия токенов
Рутинный поиск — дешевле; сложное проектирование — сильнее. Ограничить 1–2 активных субагента на небольшой PR. Не передавать всем агентам гигантские графические и аудиопаки. Сводки и progress — короткие, файлы по запросу.
