/** Постоянные фразы приложения: их всегда озвучивает запись, а не синтез речи. */
export const PHRASE = {
  hello: 'Привет! Поиграем?',
  pick: 'Выбери, во что поиграем.',
  tap: 'Нажми на картинку, чтобы начать.',
  good: 'Получилось!',
  again: 'Давай проверим ещё раз.',
  nextTotal: 'Верно! А сколько всего?',
  nextResult: 'Верно! Сколько получится?',
  nextTrees: 'Верно! А сколько всего деревьев?',
  nextDefault: 'Верно! А теперь: сколько всего?',
  nextEach: 'Верно! А сколько на каждой?',
} as const;

/**
 * Похвала за верный ответ и поддержка после неверного — разными словами, чтобы Счётик не повторялся.
 * Без «неправильно» и без рода ребёнка («справился/справилась»): ошибка — повод посмотреть ещё раз.
 */
export const PRAISE = [
  PHRASE.good, 'Верно!', 'Здорово!', 'Молодец!', 'Точно!', 'Ура, правильно!', 'Отлично!', 'Так держать!', 'Вот это да!', 'Классно получилось!',
];
export const SUPPORT = [
  PHRASE.again, 'Почти! Попробуем ещё.', 'Посмотри ещё разок внимательно.', 'Не спеши, посчитаем вместе.',
  'Хорошая попытка! Давай снова.', 'Ничего страшного, попробуем ещё.',
];

const last = new Map<readonly string[], number>();
/** Случайная фраза из набора, не та же, что в прошлый раз. */
export function pickPhrase(list: readonly string[], rnd: () => number = Math.random): string {
  const prev = last.get(list) ?? -1;
  let i = Math.floor(rnd() * (list.length - 1));
  if (i >= prev && prev >= 0) i++;
  last.set(list, i);
  return list[i];
}

export const FIXED_PHRASES: string[] = [...new Set([...Object.values(PHRASE), ...PRAISE, ...SUPPORT])];
