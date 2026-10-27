import type { Mission } from './missions';

/**
 * Миссии по учебникам NCERT для островов десятка и групп (N17–N24)
 * и для острова сотен, 3 класс (N25–N33). Механики описаны в numbers.ts.
 */
/** Разобранный пример на числах самой карточки. */
const steps = (step: number, n: number) => Array.from({ length: n }, (_, i) => (i + 1) * step);
function toHundred(n: number): string {
  const round = Math.ceil(n / 10) * 10;
  return round === n
    ? `От ${n} до 100 не хватает ${100 - n}.`
    : `${n}: до ${round} не хватает ${round - n}, от ${round} до 100 — ${100 - round}. Всего ${100 - n}.`;
}
function openSteps(a: number, b: number): string {
  const t = b - (b % 10);
  return `${a} + ${b}: ${a} + ${t} = ${a + t}, потом ${a + t} + ${b % 10} = ${a + b}.`;
}

export const MORE_MISSIONS: Mission[] = [
  // ——— Остров десятка
  {
    id: 'N17', title: 'Бусы до 100', skill: 'M07', requires: [], icon: '1F9EE',
    cards: {
      A: [{ kind: 'beads100', n: 23 }, { kind: 'beads100', n: 47 }],
      B: [{ kind: 'beads100', n: 35 }, { kind: 'beads100', n: 68 }],
      C: [{ kind: 'beads100', n: 52 }, { kind: 'beads100', n: 81 }],
    },
    help: [
      'Сколько полных десятков до прищепки? А сколько бусин после них?',
      'Я подписал десятки: 10, 20, 30…',
      'Считай десятками: 10, 20, 30, а потом по одной.',
    ],
    praise: 'Ты считаешь десятками, как на настоящих счётах!',
    finish: 'Бусы до ста собраны.',
    home: 'Нанижите на нитку 100 бусин: десяток красных, десяток синих. Загадывайте числа и ищите их на бусах.',
  },
  {
    id: 'N18', title: 'Сотенная таблица', skill: 'M07', requires: ['N17'], icon: '1F4C5',
    cards: {
      A: [{ kind: 'chart100', missing: 24 }, { kind: 'chart100', missing: 57 }],
      B: [{ kind: 'chart100', missing: 38 }, { kind: 'chart100', missing: 72 }],
      C: [{ kind: 'chart100', missing: 45 }, { kind: 'chart100', missing: 89 }],
    },
    help: [
      'Какое число стоит слева? А какое справа?',
      'Я подсветил ряд и столбец.',
      'Вправо числа растут на 1, вниз — на 10.',
    ],
    praise: 'Ты нашёл число по соседям!',
    finish: 'В таблице до ста больше нет пропусков.',
    home: 'Нарисуйте таблицу 10 × 10 и закройте одно число монеткой: какое под ней?',
  },
  {
    id: 'N19', title: 'Монеты', skill: 'M19', requires: [], icon: '1FA99',
    cards: {
      A: [{ kind: 'coins', price: 3, toy: '1F9F8', name: 'мишка' }, { kind: 'coins', price: 7, toy: '26BD', name: 'мяч' }],
      B: [{ kind: 'coins', price: 6, toy: '1F697', name: 'машинка' }, { kind: 'coins', price: 9, toy: '1F388', name: 'шарик' }],
      C: [{ kind: 'coins', price: 8, toy: '1F4D6', name: 'книжка' }, { kind: 'coins', price: 12, toy: '1F9F8', name: 'мишка' }],
    },
    help: [
      'Сколько стоит игрушка? Сколько ты уже положил?',
      'Я показываю, сколько уже лежит и сколько ещё нужно.',
      'Начни с самой большой монеты, которая не больше цены, потом добавляй маленькие.',
    ],
    praise: 'Ты заплатил ровно столько, сколько нужно!',
    finish: 'Покупка оплачена.',
    home: 'Поиграйте в магазин: ценники до 20 рублей и настоящие монеты 1, 2, 5 и 10 рублей.',
  },
  {
    id: 'N20', title: 'Сколько чего?', skill: 'M20', requires: [], icon: '1F34A',
    cards: {
      A: [
        { kind: 'tally', counts: [['apple', 4], ['pear', 2], ['carrot', 5]], ask: 'most' },
        { kind: 'tally', counts: [['strawberry', 3], ['apple', 6], ['tangerine', 2]], ask: 'apple' },
      ],
      B: [
        { kind: 'tally', counts: [['pear', 5], ['tangerine', 3], ['apple', 2]], ask: 'most' },
        { kind: 'tally', counts: [['carrot', 4], ['strawberry', 7], ['pear', 3]], ask: 'carrot' },
      ],
      C: [
        { kind: 'tally', counts: [['tangerine', 6], ['carrot', 3], ['strawberry', 4]], ask: 'most' },
        { kind: 'tally', counts: [['apple', 5], ['pear', 6], ['carrot', 2]], ask: 'pear' },
      ],
    },
    help: [
      'Посчитай каждый вид отдельно.',
      'Я записал палочками: сколько палочек, столько штук.',
      'Где палочек больше всего, того и больше.',
    ],
    praise: 'Ты разобрался, чего сколько!',
    finish: 'Столбики построены.',
    home: 'Разложите игрушки по видам в столбики и спросите: каких больше? на сколько?',
  },

  // ——— Остров групп
  {
    id: 'N21', title: 'Сколько групп?', skill: 'M13', requires: [], icon: '1F6B2',
    cards: {
      A: [{ kind: 'groupsOf', total: 6, size: 2 }, { kind: 'groupsOf', total: 9, size: 3 }],
      B: [{ kind: 'groupsOf', total: 8, size: 2 }, { kind: 'groupsOf', total: 12, size: 4 }],
      C: [{ kind: 'groupsOf', total: 12, size: 3 }, { kind: 'groupsOf', total: 10, size: 2 }],
    },
    help: [
      'Сколько нужно на одну группу?',
      'Собирай группы по одной, пока хватает.',
      'Сколько раз по 2 помещается в 8? Считай: 2, 4, 6, 8 — четыре раза.',
    ],
    helpFor: (p) => ['Сколько нужно на одну группу?', 'Собирай группы по одной, пока хватает.', p.kind === 'groupsOf' ? `Считай по ${p.size}: ${steps(p.size, p.total / p.size).join(', ')}. Это ${p.total / p.size}.` : ''],
    praise: 'Ты разделил всё на равные группы!',
    finish: 'Все колёса нашли себе место.',
    home: 'Сколько пар носков получится из 10 носков? Раскладывайте по два.',
  },
  {
    id: 'N22', title: 'Лягушка прыгает', skill: 'M10', requires: [], icon: '1F438',
    cards: {
      A: [{ kind: 'jumps', step: 2, count: 4 }, { kind: 'jumps', step: 3, count: 3 }],
      B: [{ kind: 'jumps', step: 5, count: 3 }, { kind: 'jumps', step: 2, count: 5 }],
      C: [{ kind: 'jumps', step: 4, count: 3 }, { kind: 'jumps', step: 3, count: 4 }],
    },
    help: [
      'Какой длины каждый прыжок? Сколько прыжков?',
      'Я показал прыжки дугами.',
      'Прыжки по 3, четыре раза: 3, 6, 9, 12. Это 3 × 4.',
    ],
    helpFor: (p) => ['Какой длины каждый прыжок? Сколько прыжков?', 'Я показал прыжки дугами.', p.kind === 'jumps' ? `Прыжки по ${p.step}: ${steps(p.step, p.count).join(', ')}. Лягушка на ${p.step * p.count}.` : ''],
    praise: 'Ты прыгал равными шагами, как в умножении!',
    finish: 'Лягушка допрыгала.',
    home: 'Нарисуйте мелом дорожку с числами и прыгайте по 2, по 3.',
  },
  {
    id: 'N23', title: 'Половина и четверть', skill: 'M22', requires: [], icon: '1FAD3',
    cards: {
      A: [
        { kind: 'fraction', ask: 'half', options: [
          { shape: 'circle', parts: 2, shaded: 1, equal: true }, { shape: 'circle', parts: 2, shaded: 1, equal: false }, { shape: 'circle', parts: 4, shaded: 1, equal: true }] },
        { kind: 'fraction', ask: 'quarter', options: [
          { shape: 'rect', parts: 4, shaded: 3, equal: true }, { shape: 'rect', parts: 4, shaded: 1, equal: true }, { shape: 'rect', parts: 4, shaded: 1, equal: false }] },
      ],
      B: [
        { kind: 'fraction', ask: 'threeQuarters', options: [
          { shape: 'circle', parts: 4, shaded: 3, equal: false }, { shape: 'circle', parts: 4, shaded: 1, equal: true }, { shape: 'circle', parts: 4, shaded: 3, equal: true }] },
        { kind: 'fraction', ask: 'half', options: [
          { shape: 'rect', parts: 4, shaded: 1, equal: true }, { shape: 'rect', parts: 4, shaded: 2, equal: true }, { shape: 'rect', parts: 2, shaded: 1, equal: false }] },
      ],
      C: [
        { kind: 'fraction', ask: 'quarter', options: [
          { shape: 'circle', parts: 4, shaded: 1, equal: false }, { shape: 'circle', parts: 4, shaded: 1, equal: true }, { shape: 'circle', parts: 2, shaded: 1, equal: true }] },
        { kind: 'fraction', ask: 'threeQuarters', options: [
          { shape: 'rect', parts: 4, shaded: 3, equal: true }, { shape: 'rect', parts: 4, shaded: 2, equal: true }, { shape: 'rect', parts: 4, shaded: 3, equal: false }] },
      ],
    },
    help: [
      'На сколько частей разделено? Части одинаковые?',
      'Я показал, где части равные, а где нет.',
      'Половина — одна из двух равных частей, четверть — одна из четырёх равных.',
    ],
    praise: 'Ты знаешь, что доли бывают только равными!',
    finish: 'Лепёшка поделена честно.',
    home: 'Сложите лист бумаги пополам и ещё раз пополам: сколько частей? Закрасьте четверть.',
  },
  {
    id: 'N24', title: 'Мерки', skill: 'M17', requires: [], icon: '1F4CE',
    cards: {
      A: [{ kind: 'units', len: 4, unit: 'clip' }, { kind: 'units', len: 3, unit: 'pencil' }],
      B: [{ kind: 'units', len: 6, unit: 'clip' }, { kind: 'units', len: 5, unit: 'pencil' }],
      C: [{ kind: 'units', len: 7, unit: 'clip' }, { kind: 'units', len: 4, unit: 'pencil' }],
    },
    help: [
      'Мерки лежат вплотную, без щелей?',
      'Я пронумеровал мерки.',
      'Считай мерки от начала ленты до конца. Чем мерка длиннее, тем их меньше.',
    ],
    praise: 'Ты измерил мерками!',
    finish: 'Лента измерена.',
    home: 'Измерьте стол ладонями, а потом карандашами. Почему числа разные?',
  },

  // ——— Остров сотен (3 класс)
  {
    id: 'N25', title: 'Дополни до 100', skill: 'M06', requires: [], icon: '1F4AF',
    cards: {
      A: [{ kind: 'complete100', n: 70 }, { kind: 'complete100', n: 64 }],
      B: [{ kind: 'complete100', n: 38 }, { kind: 'complete100', n: 81 }],
      C: [{ kind: 'complete100', n: 45 }, { kind: 'complete100', n: 27 }],
    },
    help: [
      'Сколько до ближайшего полного десятка?',
      'Я подсветил клетки до круглого числа.',
      '64: до 70 не хватает 6, от 70 до 100 — 30. Всего 36.',
    ],
    helpFor: (p) => ['Сколько до ближайшего полного десятка?', 'Я подсветил клетки до круглого числа.', p.kind === 'complete100' ? toHundred(p.n) : ''],
    praise: 'Ты дополнил до сотни!',
    finish: 'Сотня собрана.',
    home: 'Сколько рублей не хватает до 100, если есть 65? Считайте сначала до 70.',
  },
  {
    id: 'N26', title: 'Сотни, десятки, единицы', skill: 'M21', requires: [], icon: '1F9F1',
    cards: {
      A: [{ kind: 'placeValue', h: 2, t: 4, o: 3 }, { kind: 'placeValue', h: 1, t: 0, o: 6 }],
      B: [{ kind: 'placeValue', h: 3, t: 5, o: 2 }, { kind: 'placeValue', h: 4, t: 2, o: 0 }],
      C: [{ kind: 'placeValue', h: 5, t: 1, o: 7 }, { kind: 'placeValue', h: 2, t: 6, o: 0 }],
    },
    help: [
      'Сколько больших квадратов-сотен? Сколько полосок-десятков? Сколько кубиков?',
      'Я подписал: сотни, десятки, единицы.',
      'Сотни пишем первыми, потом десятки, потом единицы. Если десятков нет, пишем 0.',
    ],
    praise: 'Ты собрал число из разрядов!',
    finish: 'Блоки разложены по местам.',
    home: 'Сотня — 100 рублей, десяток — 10, единица — 1 рубль. Соберите сумму из «купюр».',
  },
  {
    id: 'N27', title: 'Угадай число', skill: 'M21', requires: ['N26'], icon: '1F914',
    cards: {
      A: [{ kind: 'riddle', h: 3, t: 4, o: 5, order: ['o', 'h', 't'] }, { kind: 'riddle', h: 2, t: 7, o: 1, order: ['t', 'o', 'h'] }],
      B: [{ kind: 'riddle', h: 6, t: 2, o: 8, order: ['o', 't', 'h'] }, { kind: 'riddle', h: 4, t: 9, o: 3, order: ['t', 'h', 'o'] }],
      C: [{ kind: 'riddle', h: 5, t: 3, o: 9, order: ['o', 'h', 't'] }, { kind: 'riddle', h: 7, t: 1, o: 6, order: ['t', 'o', 'h'] }],
    },
    help: [
      'Где в числе сотни? Где десятки? Где единицы?',
      'Разложи: сначала сотни, потом десятки, потом единицы.',
      'Неважно, в каком порядке я сказал: сотни всегда слева.',
    ],
    praise: 'Ты разгадал число!',
    finish: 'Счётик удивлён: загадка разгадана.',
    home: 'Загадывайте друг другу числа: «4 единицы и 3 сотни, 0 десятков».',
  },
  {
    id: 'N28', title: 'Больше или меньше', skill: 'M21', requires: ['N26'], icon: '2696',
    cards: {
      A: [{ kind: 'compare3', a: 346, b: 364 }, { kind: 'compare3', a: 512, b: 498 }],
      B: [{ kind: 'compare3', a: 705, b: 750 }, { kind: 'compare3', a: 288, b: 288 }],
      C: [{ kind: 'compare3', a: 631, b: 613 }, { kind: 'compare3', a: 909, b: 990 }],
    },
    help: [
      'Сравни сначала сотни.',
      'Я написал числа по разрядам.',
      'Если сотни равны, сравни десятки; если и они равны — единицы.',
    ],
    praise: 'Ты сравнил по разрядам!',
    finish: 'Весы уравновешены.',
    home: 'Сравнивайте цены в магазине: что дороже, на сколько?',
  },
  {
    id: 'N29', title: 'Прыжками по прямой', skill: 'M06', requires: ['N25'], icon: '1F438',
    cards: {
      A: [{ kind: 'openLine', a: 26, b: 13 }, { kind: 'openLine', a: 45, b: 22 }],
      B: [{ kind: 'openLine', a: 37, b: 24 }, { kind: 'openLine', a: 58, b: 16 }],
      C: [{ kind: 'openLine', a: 19, b: 35 }, { kind: 'openLine', a: 63, b: 28 }],
    },
    help: [
      'Сколько десятков во втором числе? Сколько единиц?',
      'Я показал прыжки: сначала десятками, потом единицами.',
      '37 + 24: 37 + 20 = 57, потом 57 + 4 = 61.',
    ],
    helpFor: (p) => ['Сколько десятков во втором числе? Сколько единиц?', 'Я показал прыжки: сначала десятками, потом единицами.', p.kind === 'openLine' ? openSteps(p.a, p.b) : ''],
    praise: 'Ты сложил прыжками!',
    finish: 'Лягушка добралась до ответа.',
    home: 'Складывайте в уме: сначала десятки, потом единицы. Проговаривайте вслух.',
  },
  {
    id: 'N30', title: 'Задача на полоске', skill: 'M14', requires: ['N29'], icon: '1F4DA',
    cards: {
      A: [{ kind: 'bar', story: 'shelf', a: 18, b: 27, find: 'part' }, { kind: 'bar', story: 'aquarium', a: 12, b: 15, find: 'whole' }],
      B: [{ kind: 'bar', story: 'garden', a: 25, b: 19, find: 'part' }, { kind: 'bar', story: 'shelf', a: 34, b: 21, find: 'whole' }],
      C: [{ kind: 'bar', story: 'aquarium', a: 16, b: 29, find: 'part' }, { kind: 'bar', story: 'garden', a: 23, b: 32, find: 'whole' }],
    },
    help: [
      'Что известно: всё целое или его части?',
      'Посмотри на полоску: целое сверху, части снизу.',
      'Чтобы найти часть, из целого вычитаем известную часть. Чтобы найти целое, складываем части.',
    ],
    praise: 'Полоска помогла увидеть задачу!',
    finish: 'Задачи решены.',
    home: 'Рисуйте к задачам полоску: целое сверху, части снизу. Где знак вопроса?',
  },
  {
    id: 'N31', title: 'Симметрия', skill: 'M23', requires: [], icon: '1F98B',
    cards: {
      A: [{ kind: 'symmetry', half: ['100', '110', '111', '010'], shift: 0 }, { kind: 'symmetry', half: ['011', '001', '110', '100'], shift: 1 }],
      B: [{ kind: 'symmetry', half: ['110', '100', '101', '011'], shift: 2 }, { kind: 'symmetry', half: ['001', '011', '100', '110'], shift: 1 }],
      C: [{ kind: 'symmetry', half: ['101', '110', '001', '011'], shift: 0 }, { kind: 'symmetry', half: ['010', '011', '110', '100'], shift: 2 }],
    },
    help: [
      'Где линия сгиба? Какие клетки стоят у самой линии?',
      'Я подсветил клетки у линии сгиба.',
      'Справа всё как в зеркале: что у линии слева, то у линии справа.',
    ],
    praise: 'Узор стал симметричным!',
    finish: 'Бабочка расправила крылья.',
    home: 'Сложите лист пополам, капните краски и разверните: получится симметричная бабочка.',
  },
  {
    id: 'N32', title: 'Часы и календарь', skill: 'M18', requires: [], icon: '1F570',
    cards: {
      A: [{ kind: 'clock', h: 3, m: 0 }, { kind: 'week', day: 2, dir: 1 }],
      B: [{ kind: 'clock', h: 7, m: 30 }, { kind: 'week', day: 4, dir: -1 }],
      C: [{ kind: 'clock', h: 10, m: 0 }, { kind: 'week', day: 0, dir: -1 }],
    },
    help: [
      'Где короткая стрелка? Где длинная? Какие дни недели ты знаешь?',
      'Короткая стрелка — часы, длинная — минуты. Я выписал дни недели по порядку.',
      'Длинная на 12 — ровно час, на 6 — половина. Неделя идёт по кругу: после воскресенья снова понедельник.',
    ],
    helpFor: (p) => p.kind === 'week'
      ? ['Какие дни недели ты знаешь?', 'Я выписал дни недели по порядку.', 'Неделя идёт по кругу: после воскресенья снова понедельник.']
      : ['Где короткая стрелка? Где длинная?', 'Короткая стрелка — часы, длинная — минуты.', 'Длинная на 12 — ровно час, на 6 — половина часа.'],
    praise: 'Ты разбираешься во времени!',
    finish: 'Часы идут, неделя по порядку.',
    home: 'Смотрите на часы в важные моменты дня: «Сейчас ровно 8, пора завтракать».',
  },
  {
    id: 'N33', title: 'Метр, литр, килограмм', skill: 'M17', requires: [], icon: '1F4CF',
    cards: {
      A: [{ kind: 'unitPick', thing: 'rope' }, { kind: 'unitPick', thing: 'milk' }],
      B: [{ kind: 'unitPick', thing: 'watermelon' }, { kind: 'unitPick', thing: 'bucket' }],
      C: [{ kind: 'unitPick', thing: 'apples' }, { kind: 'unitPick', thing: 'ribbon' }],
    },
    help: [
      'Что мы узнаём: длину, сколько жидкости или вес?',
      'Длину меряют метром, жидкость — литром, вес — килограммом.',
      'Верёвку и ленту — метром, молоко и воду — литром, арбуз и яблоки — килограммом.',
    ],
    praise: 'Ты подобрал правильную мерку!',
    finish: 'Всё измерено своей меркой.',
    home: 'Найдите дома, что продаётся литрами, что метрами, а что килограммами.',
  },
];
