# Дорожная карта Math → Android → RuStore

Проект: https://github.com/kuznecovjr001-art/Math
Исходная система: React 19 + Vite + TypeScript + PWA. По README: 49 миссий, 6 островов, M01–M23, ориентир 4–9 лет. Текущее `localStorage` с ключом `mathkids:v1`. Переход на Android — расширение, а не переписывание логики.

## Главные правила
- Ни один этап не может ломать уже работающие миссии, озвучку, ассеты и web/PWA.
- Сохранение прогресса — критическая ценность: миграция, экспорт/импорт, тесты на старых данных.
- Дети 4–9 лет: без рекламы, трекеров, бесконечных streaks, штрафов, рейтингов, запугивания.
- Структура PR небольшая и проверяемая; не менять все 49 игровых компонентов одним диффом.
- Исполненные тесты отличать от запланированных; недоступный Android SDK → BLOCKED.

## Этапы

### 00. Baseline & audit — P0
**Агенты:** release-qa, android-engineer.
**Задания:** Текущий git SHA, npm ci, typecheck, tests, build, размер ассетов, реестр 49 миссий, стартовые скриншоты.
**Приёмка:** Документ baseline, число и результаты тестов, баги; нет сломанных функций.

### 01. Educational audit — P0
**Агенты:** education-specialist.
**Задания:** Верификация 49 миссий, M01–M23, prereqs, таблицы умножения, seed-генераторы, смысл помощи и завершения.
**Приёмка:** Методический чек-лист, tests seeds, ноль недостоверных заданий.

### 02. Android skeleton — P0
**Агенты:** android-engineer, storage-engineer.
**Задания:** Стабильная совместимая Capacitor и Android Gradle конфигурация, native Back/lifecycle, адаптация service worker, отдельная web/PWA сборка.
**Приёмка:** Debug APK запускается на эмуляторе; web-build жив; air-plane mode after install.

### 03. Responsive design system — P0
**Агенты:** child-ux-designer, accessibility-auditor.
**Задания:** Компоненты GameScene, AdaptiveArt, AnswerGrid, TouchTarget, ChildHeader, safe areas; tablets and phones.
**Приёмка:** Скриншоты репрезентативных 49 экранов без обрезаний, цели касания проверены.

### 04. Touch game mechanics — P0
**Агенты:** child-ux-designer, education-specialist.
**Задания:** Тапы, перетаскивание, помощь, блокировка дубликатов, альтернативы drag, восстановление после паузы.
**Приёмка:** Все 49 миссий завершаются, gesture regression; без дубликата попыток.

### 05. Motion system — P1
**Агенты:** motion-engineer, accessibility-auditor.
**Задания:** Event-driven guide poses, touch/drop/success/fail, reduced motion, performance budget.
**Приёмка:** Нет отвлекающих/зацикленных эффектов, проверен слабый Android.

### 06. Storage/progress — P0
**Агенты:** storage-engineer, learning-analytics.
**Задания:** Event schema, миграция mathkids:v1, резервная копия/восстановление, atomic writes; parse fail не уничтожает историю.
**Приёмка:** Контракт метрик, migration tests, offline robustness.

### 07. Parent dashboard — P0
**Агенты:** learning-analytics, child-ux-designer.
**Задания:** По профилю навыки, summary, trends 7/30, помощь vs самостоятельность, детальные миссии.
**Приёмка:** Формулы и графики с fixture tests, пустые состояния, TalkBack.

### 08. Parent assignment system — P0
**Агенты:** curriculum-engineer, education-specialist.
**Задания:** Режимы свободно/назначено/повторение; выбор миссий, длины сессии, prereqs, recovery.
**Приёмка:** E2E parent assigns → child completes → parent sees result.

### 09. Audio & offline — P0
**Агенты:** android-engineer, storage-engineer.
**Задания:** Проверка 551+ фраз по manifest, переключение, отмена речи при навигации, все assets в bundle.
**Приёмка:** Cold start offline; no network dependency, voice degradation handled.

### 10. Privacy/QA/Accessibility — P0
**Агенты:** privacy-security, accessibility-auditor, release-qa.
**Задания:** Тестировать Android 8+, актуальную ОС, портрет/ландшафт/крупный шрифт, Playwright + Maestro, licenses, permission audit.
**Приёмка:** Нет открытых блокирующих дефектов; test-report и исправления.

### 11. RuStore candidate — P0
**Агенты:** android-engineer, release-qa, privacy-security.
**Задания:** Релизная сборка, signing SOP, карточка RuStore, возраст, приватность, устройство/билд/версия, release notes.
**Приёмка:** Подписанный release artifact после авторизованной подписи; финальный GO/NO-GO.

## Отдельные архитектурные проблемы текущей версии
- `src/engine/progress.ts:missionCompleted` использует попытку с вариантом не A, что не гарантирует, что ребёнок завершил миссию с правильными ответами. Выделить разные статусы.
- `src/screens/MissionPlayer.tsx` может записывать успех промежуточного шага `correct && final === false`. Проверить семантику попытки и надёжность расчётов до аналитики.
- `src/engine/storage.ts` при невозможности распарсить запись отдаёт пустую структуру; нужен безопасный режим восстановления без автоматической потери истории.
- `src/screens/ParentScreen.tsx` поддерживает стартовый остров, но не отдельные назначения конкретных миссий.
- `src/games/CountGame.tsx` использует статические размеры `68 px`, `92 px` и вычисление высоты поля по числу строк; требуется адаптивная игровая область.
- `.github/workflows/pages.yml` проверяет web, но ещё не билдит нативный Android.
- `CLAUDE.md` в проекте упоминает M01–M14 и 4–6 лет, тогда как README уже M01–M23 и 4–9 лет; согласовать правила без удаления истории.
- Android WebView и PWA caching должны иметь явную политику обновления, иначе возможны устаревшие файлы и несовместимые данные.

## Definition of Done — для каждого PR
1. Описана задача и UX/модель данных.
2. Выполнен минимальный diff и добавлены тесты для нового поведения.
3. Пройдены `npm run typecheck`, `npm test`, `npm run build` (или точное описание блокера).
4. Для изменяемых экранов есть скриншоты, доступны инпуты/кнопки и отсутствуют переполнения.
5. Обратная совместимость прогресса сохранена; если миграция — доказана тестами.
6. Reviewer сообщает дефекты, owner исправляет, CI зелёный.
7. Отчёт содержит stage, SHA, PR, тесты, known issues, следующую задачу.

## Privacy / release
Для релиза проверить свежие правила RuStore: https://www.rustore.ru/help/developers/publishing-and-verifying-apps/requirement-apps и https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication. Запретить неоправданные разрешения, web-only wrapper без device functions, передачу детских данных без оснований. Не загружать релиз и не публиковать без явного действия владельца.
