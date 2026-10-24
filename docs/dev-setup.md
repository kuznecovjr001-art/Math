# Настройка среды разработки

## Что нужно на компьютере
- Node.js 22 LTS (с npm), Git, Claude Code.
- Python 3 — нужен скиллу ui-ux-pro-max (поиск по базе стилей) и хукам security-guidance.

## Плагины и скиллы (файл `.claude/settings.json`)
| Плагин | Откуда | Зачем |
|---|---|---|
| superpowers | claude-plugins-official | Дисциплина работы: план, TDD, отладка, ревью |
| frontend-design | claude-plugins-official | Выразительный, не шаблонный UI |
| feature-dev | claude-plugins-official | Команда `/feature-dev` и агенты explorer/architect/reviewer |
| security-guidance | claude-plugins-official | Предупреждения о небезопасном коде при правках и коммитах |
| plugin-dev | claude-plugins-official | Если захотим свои скиллы/команды для проекта |
| ui-ux-pro-max | nextlevelbuilder/ui-ux-pro-max-skill | База стилей, палитр, шрифтов, UX-правил |
| web-quality-skills | addyosmani/web-quality-skills | Аудит Lighthouse, доступность, Core Web Vitals, SEO |

## Ручная установка (если автопредложение не появилось)
```
/plugin marketplace add anthropics/claude-plugins-official
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin marketplace add addyosmani/web-quality-skills
/plugin install superpowers@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
/plugin install feature-dev@claude-plugins-official
/plugin install security-guidance@claude-plugins-official
/plugin install plugin-dev@claude-plugins-official
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
/plugin install web-quality-skills@addy-web-quality-skills
```

## Что стоит знать
- security-guidance при старте сессии ставит Python-пакет `claude-agent-sdk` и после каждого
  ответа запускает фоновое ревью изменений моделью — это расходует токены. Если мешает, выключи
  его в `.claude/settings.json` (`false`).
- superpowers при старте сессии подгружает свои инструкции через хук.
