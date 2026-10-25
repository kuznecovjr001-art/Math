/**
 * Свои рисунки поверх OpenMoji.
 * Положите файл в src/assets/art/ с именем из ART_NAMES (apple.png, cat.webp)
 * или с кодом OpenMoji (1F34E.png) — он сам заменит картинку во всём приложении.
 * Подходят PNG, WebP и SVG: растр сейчас, вектор потом, имена те же.
 */
export const ART_NAMES: Record<string, string> = {
  apple: '1F34E', pear: '1F350', strawberry: '1F353', tangerine: '1F34A', carrot: '1F955',
  cookie: '1F36A', fish: '1F41F', chick: '1F424', balloon: '1F388', ball: '26BD', tree: '1F333',
  gift: '1F381', train: '1F686', star: '2B50', books: '1F4DA',
  cat: '1F431', dog: '1F436', mouse: '1F42D', rabbit: '1F430', bear: '1F43B', panda: '1F43C',
  fox: '1F98A', owl: '1F989', penguin: '1F427', hedgehog: '1F994', elephant: '1F418',
  sunrise: '1F305', sun: '2600', moon: '1F319', toothbrush: '1FAA5', school: '1F3EB',
  lunch: '1F37D', bed: '1F6CF', teddy: '1F9F8', car: '1F697', box: '1F4E6', shirt: '1F455',
  feather: '1FAB6', rock: '1FAA8', pencil: '270F',
  wheel: '1F6DE', bicycle: '1F6B2', frog: '1F438', coin: '1FA99', purse: '1F45B', paperclip: '1F4CE',
  flatbread: '1FAD3', chocolate: '1F36B', butterfly: '1F98B', clock: '1F570', rope: '1FAA2', bucket: '1FAA3',
  watermelon: '1F349', ruler: '1F4CF', scales: '2696', milk: '1F95B', book: '1F4D6', abacus: '1F9EE',
  calendar: '1F4C5', ribbon: '1F380', hundred: '1F4AF', brick: '1F9F1', thinking: '1F914',
};

/** Имя файла без расширения → код картинки. Неизвестные имена считаются кодами. */
export function artCodeFromFile(path: string): string {
  const rel = path.replace(/^.*\/assets\/art\//, '').replace(/\.(png|webp|svg|jpe?g)$/i, '');
  // Файлы в подпапках (ui/icon-home, bg/map-land) ищутся по пути, как в ТЗ на графику.
  if (rel.includes('/')) return rel.toLowerCase();
  return ART_NAMES[rel.toLowerCase()] ?? rel.toUpperCase();
}

export function buildArtMap(files: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [path, url] of Object.entries(files)) {
    const code = artCodeFromFile(path);
    map[code] = url;
    // Предметы из ТЗ лежат в item/<имя>: item/feather заменяет картинку пера и там, где её ищут по коду.
    const item = /^item\/(.+)$/.exec(code);
    if (item && ART_NAMES[item[1]]) map[ART_NAMES[item[1]]] ??= url;
  }
  return map;
}

const files = import.meta.glob<string>('../assets/art/**/*.{png,webp,svg,jpg,jpeg}', {
  eager: true, query: '?url', import: 'default',
});

const CUSTOM = buildArtMap(files);

export function artSrc(code: string): string {
  return CUSTOM[code] ?? `${import.meta.env.BASE_URL}img/openmoji/${code}.svg`;
}

export function hasCustomArt(code: string): boolean {
  return code in CUSTOM;
}

/** Свой рисунок из подпапки (ui/icon-home, bg/map-land) или undefined, если его ещё нет. */
export function customArt(path: string): string | undefined {
  return CUSTOM[path];
}

/** Эмблема миссии ui/mission-a01, если нарисована, иначе общая картинка миссии. */
export function missionArt(m: { id: string; icon: string }): string {
  const own = `ui/mission-${m.id.toLowerCase()}`;
  return own in CUSTOM ? own : m.icon;
}

/** Наклейка за миссию sticker/a01, иначе эмблема. */
export function stickerArt(m: { id: string; icon: string }): string {
  const own = `sticker/${m.id.toLowerCase()}`;
  return own in CUSTOM ? own : missionArt(m);
}
