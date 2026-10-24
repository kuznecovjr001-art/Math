import type { SkillId, Variant } from '../engine/types';
import { count, plural } from './words';

export interface Fruit {
  img: string;
  forms: [string, string, string];
}

export const FRUITS = {
  apple: { img: '1F34E', forms: ['яблоко', 'яблока', 'яблок'] },
  pear: { img: '1F350', forms: ['груша', 'груши', 'груш'] },
  strawberry: { img: '1F353', forms: ['ягода', 'ягоды', 'ягод'] },
  tangerine: { img: '1F34A', forms: ['мандарин', 'мандарина', 'мандаринов'] },
} satisfies Record<string, Fruit>;

export type FruitId = keyof typeof FRUITS;

export type CardParams =
  | { kind: 'cups'; receivers: number; items: number; scene: 'tea' | 'table' }
  | { kind: 'basket'; target: number; stock: number; fruit: FruitId }
  | { kind: 'seats'; total: number; taken: number }
  | { kind: 'parcels'; start: number; change: number; op: 'add' | 'sub' }
  | { kind: 'boxes'; groups: number; per: number; stock: number; fruit: FruitId; holder: 'box' | 'plate' };

export interface Mission {
  id: string;
  title: string;
  skill: SkillId;
  requires: string[];
  /** Картинка OpenMoji для карты. */
  icon: string;
  cards: Record<Variant, CardParams[]>;
  /** Помощь по ступеням 1–3: вопрос, модель, разобранный пример. */
  help: [string, string, string];
  praise: string;
  finish: string;
  home: string;
}

export const VERSION = 'v1';

export function cardId(m: Mission, v: Variant, index: number): string {
  return `${m.skill}-${m.id}-${v}${index > 0 ? index + 1 : ''}-${VERSION}`;
}

export function fruitCount(n: number, f: FruitId): string {
  const [a, b, c] = FRUITS[f].forms;
  return count(n, a, b, c);
}

/** Озвучиваемая инструкция к карточке. */
export function instruction(p: CardParams): string {
  switch (p.kind) {
    case 'cups':
      return p.scene === 'tea'
        ? 'Дай каждому гостю одну чашку.'
        : 'Положи к каждой тарелке одну ложку.';
    case 'basket':
      return `Положи в корзину ${fruitCount(p.target, p.fruit)}.`;
    case 'seats':
      return `Тут ${count(p.total, 'место', 'места', 'мест')}. ${p.taken === 1 ? 'Один пассажир уже сел' : `${p.taken} ${plural(p.taken, 'пассажир', 'пассажира', 'пассажиров')} уже сели`}. Посади столько, сколько ещё может сесть.`;
    case 'parcels':
      return p.op === 'add'
        ? `Было ${count(p.start, 'посылка', 'посылки', 'посылок')}. Привезли ещё ${p.change}. Сколько стало?`
        : `Было ${count(p.start, 'посылка', 'посылки', 'посылок')}. ${p.change} отправили. Сколько осталось?`;
    case 'boxes': {
      const where = p.holder === 'box'
        ? `в каждую из ${p.groups} ${plural(p.groups, 'коробки', 'коробок', 'коробок')}`
        : `на каждую из ${p.groups} ${plural(p.groups, 'тарелки', 'тарелок', 'тарелок')}`;
      return `Положи ${where} по ${fruitCount(p.per, p.fruit)}.`;
    }
  }
}

/** Правильный числовой ответ карточки (для отчёта и проверки). */
export function expectedAnswer(p: CardParams): number {
  switch (p.kind) {
    case 'cups': return p.receivers;
    case 'basket': return p.target;
    case 'seats': return p.total - p.taken;
    case 'parcels': return p.op === 'add' ? p.start + p.change : p.start - p.change;
    case 'boxes': return p.groups * p.per;
  }
}

export const MISSIONS: Mission[] = [
  {
    id: 'A01',
    title: 'Чашка каждому',
    skill: 'M01',
    requires: [],
    icon: '1F431',
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
    id: 'A02',
    title: 'Собери четыре',
    skill: 'M02',
    requires: ['A01'],
    icon: '1F34E',
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
    id: 'A03',
    title: 'Пять мест',
    skill: 'M05',
    requires: ['A02'],
    icon: '1F686',
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
    id: 'A04',
    title: 'Посылки',
    skill: 'M06',
    requires: ['A03'],
    icon: '1F381',
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
      'Посчитаем вместе все посылки, которые сейчас на складе.',
    ],
    praise: 'Ты понял, привезли посылки или отправили!',
    finish: 'Все посылки дошли до домов.',
    home: 'Положите 3 кубика, добавьте 2 и спросите, сколько стало.',
  },
  {
    id: 'A05',
    title: 'Одинаковые коробки',
    skill: 'M09',
    requires: ['A04'],
    icon: '1F34A',
    cards: {
      A: [{ kind: 'boxes', groups: 3, per: 2, stock: 8, fruit: 'apple', holder: 'box' }],
      B: [{ kind: 'boxes', groups: 2, per: 3, stock: 8, fruit: 'strawberry', holder: 'plate' }],
      C: [{ kind: 'boxes', groups: 4, per: 2, stock: 10, fruit: 'tangerine', holder: 'box' }],
    },
    help: [
      'У всех ли коробок поровну?',
      'Я напишу, сколько в каждой. Проверь каждую.',
      'Смотри: по два — это два, ещё два, ещё два. Я подпишу сложение.',
    ],
    praise: 'Ты сделал одинаковые группы!',
    finish: 'Коробки готовы к отправке.',
    home: 'Положите на 2 тарелки по 3 предмета и спросите, сколько всего.',
  },
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
