import type { SkillId, Variant } from '../engine/types';
import { MORE_MISSIONS } from './missionsMore';
import { answerMore, instructionMore, isMore, type MoreParams } from './numbers';
import { count, plural } from './words';

export interface Item {
  img: string;
  forms: [string, string, string];
}

export const ITEMS = {
  apple: { img: '1F34E', forms: ['яблоко', 'яблока', 'яблок'] },
  pear: { img: '1F350', forms: ['груша', 'груши', 'груш'] },
  strawberry: { img: '1F353', forms: ['ягода', 'ягоды', 'ягод'] },
  tangerine: { img: '1F34A', forms: ['мандарин', 'мандарина', 'мандаринов'] },
  carrot: { img: '1F955', forms: ['морковка', 'морковки', 'морковок'] },
  fish: { img: '1F41F', forms: ['рыбка', 'рыбки', 'рыбок'] },
  balloon: { img: '1F388', forms: ['шарик', 'шарика', 'шариков'] },
  ball: { img: '26BD', forms: ['мяч', 'мяча', 'мячей'] },
  chick: { img: '1F424', forms: ['цыплёнок', 'цыплёнка', 'цыплят'] },
  cookie: { img: '1F36A', forms: ['печенье', 'печенья', 'печений'] },
  tree: { img: '1F333', forms: ['дерево', 'дерева', 'деревьев'] },
} satisfies Record<string, Item>;

/** Старое имя оставлено для игр, где предметы — фрукты. */
export const FRUITS = ITEMS;

export type ItemId = keyof typeof ITEMS;
export type FruitId = ItemId;

export type Shape = 'circle' | 'square' | 'triangle' | 'rectangle' | 'oval' | 'pentagon';

export const SHAPE_NAMES: Record<Shape, string> = {
  circle: 'круг',
  square: 'квадрат',
  triangle: 'треугольник',
  rectangle: 'прямоугольник',
  oval: 'овал',
  pentagon: 'пятиугольник',
};

export type CardParams =
  | { kind: 'cups'; receivers: number; items: number; scene: 'tea' | 'table' }
  | { kind: 'basket'; target: number; stock: number; fruit: ItemId; cue?: 'voice' | 'digit' }
  | { kind: 'count'; n: number; item: ItemId }
  | { kind: 'compare'; top: number; bottom: number; item: ItemId; spreadTop: boolean }
  | { kind: 'seats'; total: number; taken: number }
  | { kind: 'hidden'; total: number; visible: number; item: ItemId }
  | { kind: 'parcels'; start: number; change: number; op: 'add' | 'sub' }
  | { kind: 'shapes'; target: Shape; options: Shape[]; turn: number }
  | { kind: 'tenframe'; a: number; b: number }
  | { kind: 'tens'; tens: number; ones: number }
  | { kind: 'boxes'; groups: number; per: number; stock: number; fruit: ItemId; holder: 'box' | 'plate'; share?: boolean }
  | { kind: 'record'; per: number; groups: number; item: ItemId }
  | { kind: 'array'; rows: number; cols: number }
  | { kind: 'facts'; a: number; b: number; model: boolean }
  | { kind: 'story'; text: string; ops: string[]; op: number; answer: number }
  | { kind: 'position'; where: Where }
  | { kind: 'sort'; bins: [SortBin, SortBin]; items: SortItem[] }
  | { kind: 'pattern'; unit: Bead[]; shown: number }
  | { kind: 'flash'; n: number; layout: 'dice' | 'frame' }
  | { kind: 'zero'; start: number; lose: number }
  | { kind: 'fingers'; total: 5 | 10; up: number }
  | { kind: 'measure'; attr: MeasureAttr; a: Thing; b: Thing }
  | { kind: 'order'; events: DayEvent[] }
  | MoreParams;

/** Где посадить котёнка: на стол, под стол, в коробку, рядом с коробкой. */
export type Where = 'on' | 'under' | 'in' | 'next';
export const WHERE_TEXT: Record<Where, string> = {
  on: 'на стол', under: 'под стол', in: 'в коробку', next: 'рядом с коробкой',
};
/** Подписи зон на ступени помощи 2. */
export const WHERE_LABEL: Record<Where, string> = { on: 'на', under: 'под', in: 'в', next: 'рядом' };

export interface SortBin { title: string; icon: string }
export interface SortItem { icon: string; name: string; bin: 0 | 1 }

export type Bead = 'red' | 'blue' | 'yellow' | 'green';
export const BEAD_NAME: Record<Bead, string> = { red: 'красная', blue: 'синяя', yellow: 'жёлтая', green: 'зелёная' };

export type MeasureAttr = 'longer' | 'shorter' | 'heavier' | 'lighter';
/** Для длины — лента длиной len клеток со сдвигом shift; для массы — предмет на весах. */
export interface Thing { len?: number; shift?: number; icon?: string; name?: string; weight?: number }

export interface DayEvent { icon: string; name: string }

export interface Mission {
  id: string;
  title: string;
  skill: SkillId;
  /** Миссии, которые нужно пройти раньше (внутри острова). */
  requires: string[];
  /** Картинка OpenMoji для карты. */
  icon: string;
  cards: Record<Variant, CardParams[]>;
  /** Помощь по ступеням 1–3: вопрос, модель, разобранный пример. */
  help: [string, string, string];
  /** Помощь, зависящая от карточки (например, стратегия для факта умножения). */
  helpFor?: (p: CardParams) => [string, string, string];
  praise: string;
  finish: string;
  home: string;
}

export const VERSION = 'v1';

/** Сгенерированные карточки помечены буквой g: их содержание меняется от захода к заходу. */
export function cardId(m: Mission, v: Variant, index: number, generated = false): string {
  return `${m.skill}-${m.id}-${v}${index > 0 ? index + 1 : ''}${generated ? 'g' : ''}-${VERSION}`;
}

export function itemCount(n: number, f: ItemId): string {
  const [a, b, c] = ITEMS[f].forms;
  return count(n, a, b, c);
}
export const fruitCount = itemCount;

/** Как читать запись голосом: синтез речи не всегда понимает знаки. */
export function voiceText(text: string): string {
  return text
    .replace(/×/g, ' умножить на ')
    .replace(/ : /g, ' разделить на ')
    .replace(/−/g, ' минус ')
    .replace(/\+/g, ' плюс ')
    .replace(/=/g, ' равно ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Озвучиваемая инструкция к карточке. */
export function instruction(p: CardParams): string {
  if (isMore(p)) return instructionMore(p);
  switch (p.kind) {
    case 'cups':
      return p.scene === 'tea'
        ? 'Дай каждому гостю одну чашку.'
        : 'Положи к каждой тарелке одну ложку.';
    case 'basket':
      return p.cue === 'digit'
        ? 'Положи в корзину столько, сколько показывает цифра.'
        : `Положи в корзину ${itemCount(p.target, p.fruit)}.`;
    case 'count':
      return `Сколько здесь ${ITEMS[p.item].forms[2]}? Выбери цифру.`;
    case 'compare':
      return `Где ${ITEMS[p.item].forms[2]} больше: сверху или снизу? Или поровну?`;
    case 'seats':
      return `Тут ${count(p.total, 'место', 'места', 'мест')}. ${p.taken === 1 ? 'Один пассажир уже сел' : `${p.taken} ${plural(p.taken, 'пассажир', 'пассажира', 'пассажиров')} уже сели`}. Посади столько, сколько ещё может сесть.`;
    case 'hidden':
      return `На двух тарелках вместе ${itemCount(p.total, p.item)}. На одной ${p.visible}. Сколько спрятано под салфеткой?`;
    case 'parcels':
      return p.op === 'add'
        ? `Было ${count(p.start, 'посылка', 'посылки', 'посылок')}. Привезли ещё ${p.change === 1 ? 'одну' : p.change}. Сколько стало?`
        : `Было ${count(p.start, 'посылка', 'посылки', 'посылок')}. ${p.change === 1 ? 'Одну посылку' : p.change} отправили. Сколько осталось?`;
    case 'shapes':
      return `Найди такую же фигуру: ${SHAPE_NAMES[p.target]}. Она может быть повёрнута или другого размера.`;
    case 'tenframe':
      return p.b === 0
        ? 'Сколько фишек не хватает до полного десятка?'
        : `Сколько будет ${p.a} + ${p.b}?`;
    case 'tens':
      return 'Сколько всего палочек?';
    case 'boxes': {
      if (p.share) {
        return `Раздай ${itemCount(p.groups * p.per, p.fruit)} поровну на ${count(p.groups, 'тарелку', 'тарелки', 'тарелок')}.`;
      }
      const where = p.holder === 'box'
        ? `в каждую из ${p.groups} ${plural(p.groups, 'коробки', 'коробок', 'коробок')}`
        : `на каждую из ${p.groups} ${plural(p.groups, 'тарелки', 'тарелок', 'тарелок')}`;
      return `Положи ${where} по ${itemCount(p.per, p.fruit)}.`;
    }
    case 'record':
      return 'Какая запись подходит к этим коробкам?';
    case 'array':
      return `В саду ${count(p.rows, 'ряд', 'ряда', 'рядов')} по ${itemCount(p.cols, 'tree')}. Поверни сад.`;
    case 'facts':
      return `Сколько будет ${p.a} × ${p.b}?`;
    case 'story':
      return p.text;
    case 'position':
      return `Посади котёнка ${WHERE_TEXT[p.where]}.`;
    case 'sort':
      return `Разложи по корзинам: ${p.bins[0].title.toLowerCase()} и ${p.bins[1].title.toLowerCase()}.`;
    case 'pattern':
      return 'Какая бусина будет следующей?';
    case 'flash':
      return 'Сколько точек на карточке? Посмотри и выбери цифру.';
    case 'zero':
      return `На рубашке ${count(p.start, 'пуговица', 'пуговицы', 'пуговиц')}. ${p.lose === 1 ? 'Одна оторвалась' : `${p.lose} оторвались`}. Сколько осталось?`;
    case 'fingers':
      return p.total === 5
        ? 'Сколько пальцев загнуто на руке?'
        : 'Сколько пальцев загнуто на двух руках?';
    case 'measure':
      return {
        longer: 'Какая лента длиннее?',
        shorter: 'Какая лента короче?',
        heavier: 'Что тяжелее? Посмотри на весы.',
        lighter: 'Что легче? Посмотри на весы.',
      }[p.attr];
    case 'order':
      return 'Что сначала, что потом? Нажимай по порядку.';
  }
}

/** Индекс правильного предмета в сравнении: 0 — левый, 1 — правый. */
export function measureAnswer(p: Extract<CardParams, { kind: 'measure' }>): number {
  const len = p.attr === 'longer' || p.attr === 'shorter';
  const va = len ? p.a.len! : p.a.weight!;
  const vb = len ? p.b.len! : p.b.weight!;
  const bigger = va > vb ? 0 : 1;
  return p.attr === 'longer' || p.attr === 'heavier' ? bigger : 1 - bigger;
}

/** Правильный числовой ответ карточки (для отчёта и проверки). */
export function expectedAnswer(p: CardParams): number {
  if (isMore(p)) return answerMore(p);
  switch (p.kind) {
    case 'cups': return p.receivers;
    case 'basket': return p.target;
    case 'count': return p.n;
    case 'compare': return Math.sign(p.top - p.bottom);
    case 'seats': return p.total - p.taken;
    case 'hidden': return p.total - p.visible;
    case 'parcels': return p.op === 'add' ? p.start + p.change : p.start - p.change;
    case 'shapes': return p.options.indexOf(p.target);
    case 'tenframe': return p.b === 0 ? 10 - p.a : p.a + p.b;
    case 'tens': return p.tens * 10 + p.ones;
    case 'boxes': return p.share ? p.per : p.groups * p.per;
    case 'record': return p.per * p.groups;
    case 'array': return p.rows * p.cols;
    case 'facts': return p.a * p.b;
    case 'story': return p.answer;
    case 'position': return (['on', 'under', 'in', 'next'] as Where[]).indexOf(p.where);
    case 'sort': return p.items.length;
    case 'pattern': return (['red', 'blue', 'yellow', 'green'] as Bead[]).indexOf(p.unit[p.shown % p.unit.length]);
    case 'flash': return p.n;
    case 'zero': return p.start - p.lose;
    case 'fingers': return p.total - p.up;
    case 'measure': return measureAnswer(p);
    case 'order': return p.events.length;
  }
}

/**
 * Подсказка-стратегия для факта a × b (по a, b раз):
 * известный факт и одна группа — как в материалах проекта (6 × 7 = 5 × 7 + 7).
 * Итог не называется: его ребёнок находит сам.
 */
const times = (n: number) => plural(n, 'раз', 'раза', 'раз');

export function strategyHint(a: number, b: number): string {
  switch (a) {
    case 0: return `Ноль, взятый ${b} ${times(b)}, — это ноль: в каждой группе пусто.`;
    case 1: return `По одному ${b} ${times(b)} — это просто ${b}.`;
    case 2: return `По два ${b} ${times(b)} — удвой ${b}: ${b} + ${b}.`;
    case 3: return `3 × ${b} = 2 × ${b} + ${b} = ${2 * b} + ${b}.`;
    case 4: return `4 × ${b} — удвой 2 × ${b}: ${2 * b} + ${2 * b}.`;
    case 5: return `По пять: половина от 10 × ${b}, это половина от ${10 * b}.`;
    case 6: return `6 × ${b} = 5 × ${b} + ${b} = ${5 * b} + ${b}.`;
    case 7: return `7 × ${b} = 5 × ${b} + 2 × ${b} = ${5 * b} + ${2 * b}.`;
    case 8: return `8 × ${b} = 10 × ${b} − 2 × ${b} = ${10 * b} − ${2 * b}.`;
    case 9: return `9 × ${b} = 10 × ${b} − ${b} = ${10 * b} − ${b}.`;
    case 10: return `По десять ${b} ${times(b)} — это ${count(b, 'десяток', 'десятка', 'десятков')}.`;
    default: return `${a} × ${b}: сложи ${b} ${times(b)} по ${a}.`;
  }
}

/** Варианты ответа для факта: соседние факты и частая ошибка «сложил вместо умножил». */
export function factChoices(a: number, b: number): number[] {
  const right = a * b;
  const wrong = [a * (b + 1), a * (b - 1), a + b, right + 1, right + 10]
    .filter((x) => x >= 0 && x !== right);
  const uniq = [...new Set(wrong)].slice(0, 2);
  const all = [right, ...uniq].sort((x, y) => x - y);
  const shift = (a + b) % 3;
  return all.slice(shift).concat(all.slice(0, shift));
}

const facts = (a: number, bs: number[], model: boolean): CardParams[] =>
  bs.map((b) => ({ kind: 'facts', a, b, model }));

function factsMission(
  id: string, title: string, icon: string, requires: string[],
  a: number[], learn: number[], probe: number[], review: number[], home: string,
): Mission {
  const pick = (bs: number[], model: boolean) =>
    bs.map((b, i) => facts(a[i % a.length], [b], model)[0]);
  return {
    id, title, skill: 'M12', requires, icon,
    cards: { A: pick(learn, true), B: pick(probe, false), C: pick(review, false) },
    help: [
      'Сколько групп? По сколько в каждой?',
      'Посмотри на группы точек.',
      'Используй то, что уже знаешь.',
    ],
    helpFor: (p) => p.kind === 'facts'
      ? [
          `Это по ${p.a}, ${p.b} ${plural(p.b, 'раз', 'раза', 'раз')}. Сколько групп? По сколько в каждой?`,
          'Посмотри на группы точек и считай группами.',
          strategyHint(p.a, p.b),
        ]
      : ['Подумай ещё.', 'Посмотри на модель.', 'Разберём вместе.'],
    praise: 'Ты нашёл ответ через то, что уже знаешь!',
    finish: 'Ещё одна часть таблицы открыта.',
    home,
  };
}

export const MISSIONS: Mission[] = [
  // ——— Остров 1. Количество (примерно 4–5 лет)
  {
    id: 'A01', title: 'Чашка каждому', skill: 'M01', requires: [], icon: '1F431',
    cards: {
      A: [{ kind: 'cups', receivers: 4, items: 6, scene: 'tea' }],
      B: [{ kind: 'cups', receivers: 3, items: 5, scene: 'tea' }],
      C: [{ kind: 'cups', receivers: 5, items: 7, scene: 'table' }],
    },
    help: [
      'Посмотри: у всех ли по одной?',
      'Проверим по одному. Я подсвечу тех, у кого не одна.',
      'Смотри: одному — одна. Я дам чашку первому, а ты продолжай.',
    ],
    praise: 'Ты дал каждому ровно по одной!',
    finish: 'Все получили по чашке. Начинается чаепитие!',
    home: 'Положите вместе по салфетке рядом с каждой тарелкой.',
  },
  {
    id: 'A02', title: 'Собери нужное число', skill: 'M02', requires: ['A01'], icon: '1F34E',
    cards: {
      A: [{ kind: 'basket', target: 4, stock: 7, fruit: 'apple' }],
      B: [{ kind: 'basket', target: 3, stock: 6, fruit: 'pear' }],
      C: [{ kind: 'basket', target: 5, stock: 8, fruit: 'strawberry' }],
    },
    help: [
      'Считай по одному и перекладывай.',
      'Я подпишу, какие ты уже посчитал.',
      'Я покажу места в корзине. Положи по одному в каждое.',
    ],
    praise: 'Ты считал по одному и остановился вовремя!',
    finish: 'Корзина собрана и едет к получателю.',
    home: 'Попросите ребёнка дать вам ровно четыре ложки.',
  },
  {
    id: 'N01', title: 'Цифра и количество', skill: 'M03', requires: ['A02'], icon: '1F424',
    cards: {
      A: [
        { kind: 'count', n: 3, item: 'chick' },
        { kind: 'basket', target: 4, stock: 7, fruit: 'carrot', cue: 'digit' },
      ],
      B: [
        { kind: 'count', n: 5, item: 'fish' },
        { kind: 'basket', target: 3, stock: 6, fruit: 'apple', cue: 'digit' },
      ],
      C: [
        { kind: 'count', n: 4, item: 'balloon' },
        { kind: 'basket', target: 5, stock: 8, fruit: 'pear', cue: 'digit' },
      ],
    },
    help: [
      'Посчитай по одному, ничего не пропусти.',
      'Я подпишу каждый предмет по порядку.',
      'Последнее число при счёте — это сколько всего.',
    ],
    praise: 'Ты связал цифру и количество!',
    finish: 'Цыплята пересчитаны, корзины собраны.',
    home: 'Покажите цифру на календаре и попросите принести столько же игрушек.',
  },
  {
    id: 'N02', title: 'Где больше?', skill: 'M04', requires: ['A01'], icon: '26BD',
    cards: {
      A: [
        { kind: 'compare', top: 4, bottom: 5, item: 'ball', spreadTop: true },
        { kind: 'compare', top: 3, bottom: 3, item: 'apple', spreadTop: false },
      ],
      B: [
        { kind: 'compare', top: 5, bottom: 4, item: 'fish', spreadTop: false },
        { kind: 'compare', top: 4, bottom: 4, item: 'cookie', spreadTop: true },
      ],
      C: [
        { kind: 'compare', top: 3, bottom: 5, item: 'balloon', spreadTop: true },
        { kind: 'compare', top: 6, bottom: 5, item: 'carrot', spreadTop: false },
      ],
    },
    help: [
      'Длинный ряд — не всегда больше. Как проверить?',
      'Составим пары: верхний с нижним.',
      'У кого остался предмет без пары, тех больше. Если пары у всех — поровну.',
    ],
    praise: 'Ты сравнил парами, а не на глаз!',
    finish: 'Все ряды сравнены.',
    home: 'Разложите ложки и вилки в два ряда разной длины и спросите, чего больше.',
  },

  // ——— Остров 2. Состав числа и действия (примерно 5–6 лет)
  {
    id: 'A03', title: 'Пять мест', skill: 'M05', requires: [], icon: '1F686',
    cards: {
      A: [{ kind: 'seats', total: 5, taken: 2 }],
      B: [{ kind: 'seats', total: 5, taken: 1 }],
      C: [{ kind: 'seats', total: 4, taken: 2 }],
    },
    help: [
      'Какие места ещё свободны?',
      'Я подсвечу свободные места. Посчитай их.',
      'Смотри: свободное место — один пассажир. Сажаю первого, дальше ты.',
    ],
    praise: 'Ты занял все свободные места!',
    finish: 'Все места заняты. Поезд отправляется!',
    home: 'Поставьте 5 стульев для игрушек: 2 уже заняты. Сколько ещё игрушек сядет?',
  },
  {
    id: 'N03', title: 'Под салфеткой', skill: 'M05', requires: ['A03'], icon: '1F353',
    cards: {
      A: [{ kind: 'hidden', total: 5, visible: 3, item: 'strawberry' }],
      B: [{ kind: 'hidden', total: 7, visible: 4, item: 'strawberry' }],
      C: [{ kind: 'hidden', total: 6, visible: 2, item: 'cookie' }],
    },
    help: [
      'Всего столько. Сколько мы видим? Сколько не хватает?',
      'Я покажу все места: видимые и спрятанные.',
      'Досчитай от видимых до общего числа.',
    ],
    praise: 'Ты нашёл спрятанную часть!',
    finish: 'Салфетку подняли — всё сошлось.',
    home: 'Спрячьте часть из 7 пуговиц под ладонью и спросите, сколько спрятано.',
  },
  {
    id: 'A04', title: 'Посылки', skill: 'M06', requires: ['A03'], icon: '1F381',
    cards: {
      A: [
        { kind: 'parcels', start: 3, change: 2, op: 'add' },
        { kind: 'parcels', start: 5, change: 2, op: 'sub' },
      ],
      B: [
        { kind: 'parcels', start: 2, change: 2, op: 'add' },
        { kind: 'parcels', start: 4, change: 1, op: 'sub' },
      ],
      C: [
        { kind: 'parcels', start: 4, change: 1, op: 'add' },
        { kind: 'parcels', start: 5, change: 3, op: 'sub' },
      ],
    },
    help: [
      'Посылок стало больше или меньше?',
      'Посмотрим ещё раз, что случилось с посылками.',
      'Например: было 4, привезли ещё 2 — стало 6; было 4, отправили 1 — осталось 3.',
    ],
    praise: 'Ты понял, привезли посылки или отправили!',
    finish: 'Все посылки дошли до домов.',
    home: 'Положите 3 кубика, добавьте 2 и спросите, сколько стало.',
  },
  {
    id: 'N04', title: 'Фигуры', skill: 'M08', requires: [], icon: '1F388',
    cards: {
      A: [
        { kind: 'shapes', target: 'triangle', options: ['circle', 'triangle', 'square'], turn: 40 },
        { kind: 'shapes', target: 'square', options: ['square', 'rectangle', 'circle'], turn: 30 },
      ],
      B: [
        { kind: 'shapes', target: 'rectangle', options: ['oval', 'triangle', 'rectangle'], turn: 90 },
        { kind: 'shapes', target: 'circle', options: ['oval', 'circle', 'pentagon'], turn: 0 },
      ],
      C: [
        { kind: 'shapes', target: 'pentagon', options: ['pentagon', 'square', 'triangle'], turn: 72 },
        { kind: 'shapes', target: 'oval', options: ['circle', 'rectangle', 'oval'], turn: 60 },
      ],
    },
    help: [
      'Посчитай углы. Сколько их у фигуры сверху?',
      'Я отмечу углы у всех фигур.',
      'Поворот и размер не меняют фигуру. Ищи ту, у которой столько же углов и такие же стороны.',
    ],
    praise: 'Ты узнал фигуру, даже повёрнутую!',
    finish: 'Все детали встали на свои места.',
    home: 'Найдите дома предметы-круги и предметы-прямоугольники.',
  },

  // ——— Остров 3. Десяток (примерно 6–7 лет)
  {
    id: 'N05', title: 'Полный десяток', skill: 'M07', requires: [], icon: '1F36A',
    cards: {
      A: [{ kind: 'tenframe', a: 7, b: 0 }, { kind: 'tenframe', a: 4, b: 0 }],
      B: [{ kind: 'tenframe', a: 6, b: 0 }, { kind: 'tenframe', a: 8, b: 0 }],
      C: [{ kind: 'tenframe', a: 3, b: 0 }, { kind: 'tenframe', a: 9, b: 0 }],
    },
    help: [
      'Сколько клеток пустые?',
      'Я подсвечу пустые клетки.',
      'Например, в рамке 7 фишек: 7 и 3 — это 10, значит, не хватает 3.',
    ],
    praise: 'Ты знаешь, сколько нужно до десяти!',
    finish: 'Все рамки заполнены до десятка.',
    home: 'Сложите 10 ложек в коробку для яиц или в два ряда по 5.',
  },
  {
    id: 'N06', title: 'Через десяток', skill: 'M06', requires: ['N05'], icon: '1F955',
    cards: {
      A: [{ kind: 'tenframe', a: 8, b: 7 }, { kind: 'tenframe', a: 9, b: 4 }],
      B: [{ kind: 'tenframe', a: 9, b: 6 }, { kind: 'tenframe', a: 7, b: 5 }],
      C: [{ kind: 'tenframe', a: 8, b: 5 }, { kind: 'tenframe', a: 6, b: 7 }],
    },
    help: [
      'Сколько не хватает первому числу до десяти?',
      'Перенесу фишки из второй рамки, чтобы получился полный десяток.',
      'Например, 8 + 7 = 8 + 2 + 5 = 10 + 5.',
    ],
    praise: 'Ты собрал десяток и досчитал остаток!',
    finish: 'Ты собрал десяток и досчитал остаток.',
    home: 'Спросите: 8 + 7 — как удобнее, досчитать или сначала до 10?',
  },
  {
    id: 'N07', title: 'Десятки и единицы', skill: 'M07', requires: ['N05'], icon: '1F333',
    cards: {
      A: [{ kind: 'tens', tens: 1, ones: 2 }, { kind: 'tens', tens: 2, ones: 3 }],
      B: [{ kind: 'tens', tens: 1, ones: 6 }, { kind: 'tens', tens: 3, ones: 1 }],
      C: [{ kind: 'tens', tens: 2, ones: 7 }, { kind: 'tens', tens: 4, ones: 0 }],
    },
    help: [
      'Сколько в каждой связке?',
      'Я подпишу связки: в каждой 10.',
      'Считай десятками, потом добавь отдельные палочки.',
    ],
    praise: 'Ты считал десятками!',
    finish: 'Все палочки пересчитаны.',
    home: 'Свяжите резинкой 10 карандашей и посчитайте вместе пачками.',
  },

  // ——— Остров 4. Равные группы (примерно 6–8 лет)
  {
    id: 'A05', title: 'Одинаковые коробки', skill: 'M09', requires: [], icon: '1F34A',
    cards: {
      A: [{ kind: 'boxes', groups: 3, per: 2, stock: 8, fruit: 'apple', holder: 'box' }],
      B: [{ kind: 'boxes', groups: 2, per: 3, stock: 8, fruit: 'strawberry', holder: 'plate' }],
      C: [{ kind: 'boxes', groups: 4, per: 2, stock: 10, fruit: 'tangerine', holder: 'box' }],
    },
    help: [
      'У всех ли коробок поровну?',
      'Я напишу, сколько в каждой. Проверь каждую.',
      'Смотри: в каждой коробке поровну — значит, можно сложить одинаковые числа. Я подпишу сложение.',
    ],
    praise: 'Ты сделал одинаковые группы!',
    finish: 'Коробки готовы к отправке.',
    home: 'Положите на 2 тарелки по 3 предмета и спросите, сколько всего.',
  },
  {
    id: 'A06', title: 'Запись для коробок', skill: 'M10', requires: ['A05'], icon: '1F381',
    cards: {
      A: [{ kind: 'record', per: 2, groups: 3, item: 'apple' }],
      B: [{ kind: 'record', per: 2, groups: 4, item: 'pear' }],
      C: [{ kind: 'record', per: 4, groups: 2, item: 'tangerine' }],
    },
    help: [
      'Сколько в каждой коробке? Сколько коробок?',
      'Каждое слагаемое — одна коробка.',
      'Например, по пять два раза: 5 + 5, это записывают 5 × 2.',
    ],
    praise: 'Ты понял, что значит запись умножения!',
    finish: 'Персонаж получил понятную инструкцию для заказа.',
    home: 'Разложите 3 тарелки по 2 печенья и вместе запишите: 2 × 3.',
  },
  {
    id: 'A11', title: 'Поверни сад', skill: 'M11', requires: ['A06'], icon: '1F333',
    cards: {
      A: [{ kind: 'array', rows: 3, cols: 4 }],
      B: [{ kind: 'array', rows: 2, cols: 5 }],
      C: [{ kind: 'array', rows: 4, cols: 2 }],
    },
    help: [
      'Мы добавили или убрали хоть одно дерево?',
      'Посчитай деревья в рядах до и после поворота.',
      'Ряды стали столбцами. 3 × 4 и 4 × 3 — одно и то же количество.',
    ],
    praise: 'Ты понял: от поворота деревьев не стало больше!',
    finish: 'Сад поместился на площадке без потерь.',
    home: 'Выложите печенье прямоугольником 3 на 4 и поверните тарелку.',
  },
  {
    id: 'N08', title: 'Раздели поровну', skill: 'M13', requires: ['A05'], icon: '1F36A',
    cards: {
      A: [{ kind: 'boxes', groups: 3, per: 2, stock: 6, fruit: 'cookie', holder: 'plate', share: true }],
      B: [{ kind: 'boxes', groups: 2, per: 4, stock: 8, fruit: 'apple', holder: 'plate', share: true }],
      C: [{ kind: 'boxes', groups: 4, per: 3, stock: 12, fruit: 'strawberry', holder: 'plate', share: true }],
    },
    help: [
      'Всем ли досталось поровну? Всё ли раздали?',
      'Я напишу, сколько на каждой тарелке.',
      'Раздавай по кругу: каждой тарелке по одному, потом ещё по одному.',
    ],
    praise: 'Ты разделил поровну!',
    finish: 'Все гости получили одинаково.',
    home: 'Раздайте 12 виноградин поровну троим и спросите, сколько у каждого.',
  },

  // ——— Остров 5. Таблица умножения (примерно 7–9 лет, 1–3 класс)
  factsMission('T02', 'По два', '1F43B', [], [2], [3, 4], [5, 7], [6, 9],
    'Считайте пары носков: по два, сколько носков в 5 парах?'),
  factsMission('T05', 'По пять и по десять', '1F436', ['T02'], [5, 10], [3, 4, 6], [7, 3, 8], [6, 9, 4],
    'Считайте монетами по 5 и по 10 рублей.'),
  factsMission('T01', 'Один и ноль', '1F42D', ['T02'], [1, 0], [6, 4], [8, 7], [9, 5],
    'Спросите: сколько яблок в 5 пустых корзинах?'),
  factsMission('T04', 'По четыре', '1F43C', ['T02'], [4], [3, 5], [6, 7], [8, 9],
    'Посчитайте ножки у 3 стульев: по 4, 3 раза.'),
  factsMission('T03', 'По три', '1F98A', ['T02'], [3], [4, 6], [7, 5], [8, 9],
    'Посчитайте колёса у трёхколёсных велосипедов.'),
  factsMission('T09', 'По девять', '1F427', ['T05'], [9], [3, 5], [6, 4], [7, 8],
    'Спросите, почему 9 × 4 — это 10 × 4 без одной четвёрки.'),
  factsMission('T06', 'По шесть', '1F994', ['T05'], [6], [4, 5, 6], [7, 3, 8], [9, 4, 7],
    'Спросите, почему 6 × 4 — это 5 × 4 и ещё 4.'),
  factsMission('T78', 'По семь и по восемь', '1F989', ['T06', 'T04'], [7, 8], [4, 6], [7, 3], [8, 9],
    'Перемешайте карточки с примерами из всех групп и решайте вместе.'),
  {
    id: 'S01', title: 'Задачи', skill: 'M14', requires: ['T05'], icon: '1F4DA',
    cards: {
      A: [
        { kind: 'story', text: 'В вазе 8 красных и 7 жёлтых тюльпанов. Сколько всего тюльпанов?', ops: ['8 + 7', '8 − 7'], op: 0, answer: 15 },
        { kind: 'story', text: 'В 4 коробках по 6 карандашей. Сколько всего карандашей?', ops: ['6 + 4', '6 × 4', '6 − 4'], op: 1, answer: 24 },
      ],
      B: [
        { kind: 'story', text: '12 конфет разложили поровну на 3 тарелки. Сколько конфет на каждой?', ops: ['12 − 3', '12 + 3', '12 : 3'], op: 2, answer: 4 },
        { kind: 'story', text: 'В автобусе было 15 пассажиров. 6 вышли. Сколько осталось?', ops: ['15 − 6', '15 + 6'], op: 0, answer: 9 },
      ],
      C: [
        { kind: 'story', text: '18 яблок разложили по 6 в пакет. Сколько получилось пакетов?', ops: ['18 × 6', '18 : 6', '18 − 6'], op: 1, answer: 3 },
        { kind: 'story', text: 'У Маши 3 пакета по 5 яблок. Она съела 2 яблока. Сколько осталось?', ops: ['5 × 3 + 2', '5 + 3 − 2', '5 × 3 − 2'], op: 2, answer: 13 },
      ],
    },
    help: [
      'Что известно? Что нужно найти?',
      'Представь это предметами: стало больше или меньше? Есть ли равные группы?',
      'Если равные группы — умножаем, если раздаём поровну — делим.',
    ],
    praise: 'Ты выбрал действие и решил задачу!',
    finish: 'Все задачи разобраны.',
    home: 'Придумайте вместе задачу про покупки в магазине и решите её.',
  },
  // ——— Добавлено по учебникам NCERT: остров счёта
  {
    id: 'N09', title: 'Где котёнок?', skill: 'M15', requires: [], icon: '1F431',
    cards: {
      A: [{ kind: 'position', where: 'on' }, { kind: 'position', where: 'in' }],
      B: [{ kind: 'position', where: 'under' }, { kind: 'position', where: 'next' }],
      C: [{ kind: 'position', where: 'in' }, { kind: 'position', where: 'under' }],
    },
    help: [
      'Где верх у стола? Где низ? Где коробка?',
      'Я подписал места: на, под, в, рядом.',
      'Послушай ещё раз и нажми на место, которое светится.',
    ],
    praise: 'Ты нашёл правильное место!',
    finish: 'Котёнок доволен: он сидит там, где ты сказал.',
    home: 'Поиграйте в прятки с игрушкой: «Мишка под стулом? На полке? В коробке?»',
  },
  {
    id: 'N10', title: 'Разложи по корзинам', skill: 'M16', requires: [], icon: '1F9F8',
    cards: {
      A: [{
        kind: 'sort',
        bins: [{ title: 'Еда', icon: '1F37D' }, { title: 'Игрушки', icon: '1F9F8' }],
        items: [
          { icon: '1F34E', name: 'яблоко', bin: 0 }, { icon: '26BD', name: 'мяч', bin: 1 },
          { icon: '1F955', name: 'морковка', bin: 0 }, { icon: '1F388', name: 'шарик', bin: 1 },
          { icon: '1F36A', name: 'печенье', bin: 0 }, { icon: '1F697', name: 'машинка', bin: 1 },
        ],
      }],
      B: [{
        kind: 'sort',
        bins: [{ title: 'Животные', icon: '1F431' }, { title: 'Еда', icon: '1F37D' }],
        items: [
          { icon: '1F418', name: 'слон', bin: 0 }, { icon: '1F350', name: 'груша', bin: 1 },
          { icon: '1F424', name: 'цыплёнок', bin: 0 }, { icon: '1F36A', name: 'печенье', bin: 1 },
          { icon: '1F42D', name: 'мышка', bin: 0 }, { icon: '1F353', name: 'ягода', bin: 1 },
        ],
      }],
      C: [{
        kind: 'sort',
        bins: [{ title: 'Игрушки', icon: '1F9F8' }, { title: 'Животные', icon: '1F431' }],
        items: [
          { icon: '1F697', name: 'машинка', bin: 0 }, { icon: '1F436', name: 'собака', bin: 1 },
          { icon: '1F388', name: 'шарик', bin: 0 }, { icon: '1F41F', name: 'рыбка', bin: 1 },
          { icon: '1F9F8', name: 'мишка-игрушка', bin: 0 }, { icon: '1F430', name: 'кролик', bin: 1 },
        ],
      }],
    },
    help: [
      'Что общего у предметов в одной корзине?',
      'Я отметил то, что лежит не в своей корзине. Нажми на него, чтобы вернуть.',
      'Едой называют то, что едят. Игрушками играют. Животные живые.',
    ],
    praise: 'Ты разложил всё по группам!',
    finish: 'В корзинах порядок.',
    home: 'Разберите вместе игрушки: машинки в одну коробку, мягкие игрушки в другую. Потом придумайте другое правило.',
  },
  {
    id: 'N11', title: 'Продолжи бусы', skill: 'M16', requires: ['N10'], icon: '1F381',
    cards: {
      A: [{ kind: 'pattern', unit: ['red', 'blue'], shown: 5 }, { kind: 'pattern', unit: ['red', 'red', 'blue'], shown: 6 }],
      B: [{ kind: 'pattern', unit: ['yellow', 'green'], shown: 4 }, { kind: 'pattern', unit: ['blue', 'yellow', 'yellow'], shown: 7 }],
      C: [{ kind: 'pattern', unit: ['red', 'blue', 'yellow'], shown: 7 }, { kind: 'pattern', unit: ['green', 'green', 'red'], shown: 5 }],
    },
    help: [
      'Какие бусины повторяются? Назови их по порядку.',
      'Я разделил бусы на одинаковые кусочки.',
      'Скажи вслух все бусины подряд, и следующая сама придёт.',
    ],
    praise: 'Ты нашёл правило узора!',
    finish: 'Бусы готовы.',
    home: 'Сделайте узор хлопками: хлоп, хлоп, топ… Пусть ребёнок продолжит.',
  },
  {
    id: 'N12', title: 'Точки на карточке', skill: 'M02', requires: ['A02'], icon: '1F43C',
    cards: {
      A: [{ kind: 'flash', n: 3, layout: 'dice' }, { kind: 'flash', n: 5, layout: 'dice' }],
      B: [{ kind: 'flash', n: 4, layout: 'dice' }, { kind: 'flash', n: 6, layout: 'frame' }],
      C: [{ kind: 'flash', n: 2, layout: 'dice' }, { kind: 'flash', n: 7, layout: 'frame' }],
    },
    help: [
      'Какие знакомые кусочки ты видишь: два, три?',
      'Карточка больше не прячется. Посмотри спокойно.',
      'Я пронумеровал точки.',
    ],
    praise: 'Ты узнал число с одного взгляда!',
    finish: 'Все карточки узнаны.',
    home: 'Покажите кубик на секунду и спросите, сколько точек. Потом поменяйтесь.',
  },
  {
    id: 'N13', title: 'Пуговицы и ноль', skill: 'M03', requires: ['N01'], icon: '1F455',
    cards: {
      A: [{ kind: 'zero', start: 3, lose: 1 }, { kind: 'zero', start: 2, lose: 2 }],
      B: [{ kind: 'zero', start: 4, lose: 4 }, { kind: 'zero', start: 3, lose: 2 }],
      C: [{ kind: 'zero', start: 5, lose: 5 }, { kind: 'zero', start: 4, lose: 3 }],
    },
    help: [
      'Сколько было? Сколько оторвалось?',
      'Я зачеркнул пуговицы, которые оторвались.',
      'Если не осталось ни одной, это ноль: 0.',
    ],
    praise: 'Ты знаешь, что ноль — это когда ничего нет!',
    finish: 'Рубашку можно пришивать.',
    home: 'Ешьте виноград по одной ягоде и считайте, сколько осталось, до нуля.',
  },

  // ——— Добавлено по учебникам NCERT: остров состава
  {
    id: 'N14', title: 'Пары на пальцах', skill: 'M05', requires: ['A03'], icon: '1F430',
    cards: {
      A: [{ kind: 'fingers', total: 5, up: 3 }, { kind: 'fingers', total: 10, up: 6 }],
      B: [{ kind: 'fingers', total: 5, up: 2 }, { kind: 'fingers', total: 10, up: 7 }],
      C: [{ kind: 'fingers', total: 5, up: 4 }, { kind: 'fingers', total: 10, up: 3 }],
    },
    help: [
      'Сколько всего пальцев? Сколько поднято?',
      'Я подписал поднятые пальцы.',
      'На руке 5 пальцев: поднятые и загнутые вместе дают 5. На двух руках — 10.',
    ],
    praise: 'Ты знаешь пары чисел до пяти и до десяти!',
    finish: 'Пальцы сосчитаны.',
    home: 'Покажите 3 пальца: «Сколько загнуто?» Потом пусть ребёнок загадывает вам.',
  },
  {
    id: 'N15', title: 'Длиннее и тяжелее', skill: 'M17', requires: [], icon: '1F418',
    cards: {
      A: [
        { kind: 'measure', attr: 'longer', a: { len: 4, shift: 3 }, b: { len: 6, shift: 0 } },
        { kind: 'measure', attr: 'heavier', a: { icon: '1FAB6', name: 'перо', weight: 1 }, b: { icon: '1FAA8', name: 'камень', weight: 5 } },
      ],
      B: [
        { kind: 'measure', attr: 'shorter', a: { len: 5, shift: 0 }, b: { len: 3, shift: 3 } },
        { kind: 'measure', attr: 'heavier', a: { icon: '1FAA8', name: 'камень', weight: 5 }, b: { icon: '1F388', name: 'шарик', weight: 1 } },
      ],
      C: [
        { kind: 'measure', attr: 'longer', a: { len: 7, shift: 0 }, b: { len: 5, shift: 3 } },
        { kind: 'measure', attr: 'lighter', a: { icon: '270F', name: 'карандаш', weight: 2 }, b: { icon: '1FAB6', name: 'перо', weight: 1 } },
      ],
    },
    help: [
      'Начинаются ли ленты в одном месте? Какая чаша весов ниже?',
      'Я выровнял ленты по началу. На весах тяжёлое опускается вниз.',
      'Длиннее та, у которой конец дальше при общем начале. Тяжелее то, что перевешивает.',
    ],
    // Ленты и весы — разные карточки одной миссии: подсказка только про то, что на экране.
    helpFor: (p) => p.kind === 'measure' && (p.attr === 'longer' || p.attr === 'shorter')
      ? ['Начинаются ли ленты в одном месте?', 'Я выровнял ленты по началу.', 'Длиннее та, у которой конец дальше при общем начале.']
      : ['Какая чаша весов ниже?', 'На весах тяжёлое опускается вниз, лёгкое поднимается.', 'Тяжелее то, что перевешивает: его чаша внизу.'],
    praise: 'Ты сравнил правильно, а не на глаз!',
    finish: 'Все ленты и грузы сравнены.',
    home: 'Сравните два шнурка, приложив концы, и подержите в руках яблоко и мандарин: что тяжелее?',
  },
  {
    id: 'N16', title: 'Утро, день, вечер', skill: 'M18', requires: [], icon: '1F305',
    cards: {
      A: [{ kind: 'order', events: [
        { icon: '1F305', name: 'просыпаемся' }, { icon: '26BD', name: 'играем днём' }, { icon: '1F6CF', name: 'ложимся спать' },
      ] }],
      B: [{ kind: 'order', events: [
        { icon: '1FAA5', name: 'чистим зубы утром' }, { icon: '1F37D', name: 'обедаем' }, { icon: '1F319', name: 'смотрим на луну' },
      ] }],
      C: [{ kind: 'order', events: [
        { icon: '1F305', name: 'просыпаемся' }, { icon: '1F37D', name: 'обедаем' }, { icon: '1F319', name: 'наступает вечер' }, { icon: '1F6CF', name: 'ложимся спать' },
      ] }],
    },
    help: [
      'Что ты делаешь сразу, как проснёшься? А перед сном?',
      'Я подписал места: утро, день, вечер.',
      'Утром встаём, днём гуляем и обедаем, вечером ложимся спать.',
    ],
    praise: 'Ты расставил день по порядку!',
    finish: 'День расписан.',
    home: 'Вечером вспомните вместе, что было утром, днём и вечером.',
  },
  ...MORE_MISSIONS,
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
