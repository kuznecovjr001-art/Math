# Свои рисунки

Файл, положенный сюда, заменяет картинку OpenMoji во всём приложении.

- Имя — латинское имя предмета из `src/content/art.ts` (`apple.webp`, `cat.webp`) или код OpenMoji (`1F34E.png`).
- `mission-a01.webp` — эмблема миссии на карте, `sticker-a01.webp` — наклейка за неё в альбоме и на финише.
- `cup`, `spoon`, `plate`, `parcel`, `passenger-seated`, `passenger-new` заменяют нарисованные в коде предметы.
- `icon-home`, `icon-sound`, `icon-help`, `icon-lock` заменяют символы ⌂ 🔊 ? 🔒.
- Подходят PNG, WebP и SVG. Позже можно положить SVG с тем же именем и удалить растр: код менять не нужно.

Сейчас здесь растровые оригиналы из комплекта «Остров счёта», ужатые в WebP: предметы и аватары 256 px, посуда 384 px, наклейки 320 px, значки 128 px. Паровоз отражён, потому что стиль `.train-head` разворачивает его.

После добавления файла: `npm run build`.

## Что уже лежит здесь

Растровые оригиналы из комплекта «Остров счёта», ужатые в WebP.

- В корне лежат предметы и звери, которые заменяют OpenMoji: `apple`, `cat`, `star`, `train` и другие. Паровоз отражён, потому что стиль `.train-head` разворачивает его.
- `ui/mission-<id>` — эмблема миссии на карте. `sticker/<id>` — наклейка в альбоме и на финише.
- `item/cup`, `item/spoon`, `item/plate`, `item/parcel`, `char/passenger-seated`, `char/passenger-new` заменяют предметы, нарисованные в коде.
- `ui/icon-*` — иконки кнопок. `bg/` — фоны карты.

## Дополнение (N09–N33 и «Остров сотен»)

- `ui/mission-n09`…`n33` и `sticker/n09`…`n33`, `ui/island-hundreds`, `bg/map-hundreds-*`, `bg/shop-*`, `bg/workshop-*`.
- Предметы в `item/`. Те, у кого есть имя в `ART_NAMES`, сами заменяют OpenMoji. Это teddy, lunch, car, elephant, feather, rock, pencil, sunrise, school, bed, toothbrush, moon, wheel, bicycle, rope, bucket, watermelon, ruler, scales и bottle. То же для `char/frog`.
- Игры берут по пути: `item/coin-*` (монеты), `item/block-*` (блоки сотен), `item/clock-face` (циферблат), `item/story-shelf|aquarium|garden` (задача на полоске).
- Пока не используются: `item/purse`, `item/tricycle`, `item/flatbread`, `item/chocolate`, `item/butterfly`.
