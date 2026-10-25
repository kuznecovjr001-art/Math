import { probeReached } from '../engine/progress';
import type { Attempt } from '../engine/types';
import { getMission, MISSIONS, type Mission } from './missions';

export interface Island {
  id: string;
  title: string;
  /** Примерный возраст оформления, не требование к ребёнку. */
  ages: string;
  /** Что ребёнок осваивает на острове. */
  goal: string;
  missions: string[];
  /** Миссии, после которых открывается следующий остров. Параллельные ветки сюда не входят. */
  core: string[];
  /** Сколько карточек в заходе: обучение, самостоятельная проба, повтор. */
  length: MissionLength;
}

export interface MissionLength { learn: number; probe: number; review: number }

/** 4–6 лет: около 7 карточек, 6–8 лет: 8, 7–9 лет: 9. Повтор короче. */
const YOUNG: MissionLength = { learn: 2, probe: 5, review: 4 };
const MIDDLE: MissionLength = { learn: 2, probe: 6, review: 4 };
const OLDER: MissionLength = { learn: 2, probe: 7, review: 5 };

/**
 * Уровни собраны по карте навыков M01–M14 и возрастной карте проекта:
 * количество → состав числа → десяток → равные группы → таблица и применение.
 * Геометрия (M08) идёт параллельной веткой и не блокирует путь.
 */
export const ISLANDS: Island[] = [
  {
    id: 'count',
    title: 'Остров счёта',
    ages: 'примерно 4–5 лет',
    goal: 'Один предмет — одно место, счёт и итоговое количество, цифра и количество, ноль, сравнение групп; расположение, группировка и узоры.',
    missions: ['A01', 'A02', 'N01', 'N02', 'N09', 'N10', 'N11', 'N12', 'N13'],
    core: ['A01', 'A02', 'N01', 'N02'],
    length: YOUNG,
  },
  {
    id: 'compose',
    title: 'Остров состава',
    ages: 'примерно 5–6 лет',
    goal: 'Состав числа, пары до 5 и 10, спрятанная часть, первые сложение и вычитание; фигуры, длина, масса и время — параллельно.',
    missions: ['A03', 'N03', 'A04', 'N04', 'N14', 'N15', 'N16'],
    core: ['A03', 'N03', 'A04'],
    length: YOUNG,
  },
  {
    id: 'ten',
    title: 'Остров десятка',
    ages: 'примерно 6–7 лет',
    goal: 'Состав десяти, сложение с переходом через десяток, десятки и единицы; числа до 100, монеты и счёт данных.',
    missions: ['N05', 'N06', 'N07', 'N17', 'N18', 'N19', 'N20'],
    core: ['N05', 'N06', 'N07'],
    length: MIDDLE,
  },
  {
    id: 'groups',
    title: 'Остров групп',
    ages: 'примерно 6–8 лет',
    goal: 'Равные группы, смысл записи умножения, перестановка на массиве, деление поровну; прыжки по числовой прямой, доли и мерки.',
    missions: ['A05', 'A06', 'A11', 'N08', 'N21', 'N22', 'N23', 'N24'],
    core: ['A05', 'A06', 'A11', 'N08'],
    length: MIDDLE,
  },
  {
    id: 'table',
    title: 'Остров таблицы',
    ages: 'примерно 7–9 лет, 1–3 класс',
    goal: 'Таблица 1–10 через связи: удвоение, по пять и десять, известный факт и ещё группа; задачи.',
    missions: ['T02', 'T05', 'T01', 'T04', 'T03', 'T09', 'T06', 'T78', 'S01'],
    core: ['T02', 'T05', 'T01', 'T04', 'T03', 'T09', 'T06', 'T78', 'S01'],
    length: OLDER,
  },
  {
    id: 'hundreds',
    title: 'Остров сотен',
    ages: 'примерно 8–9 лет, 3 класс',
    goal: 'Числа до 1000: сотни, десятки и единицы, сравнение, сложение и вычитание на открытой прямой, задачи со схемой, симметрия, часы и календарь, метр, литр и килограмм.',
    missions: ['N25', 'N26', 'N27', 'N28', 'N29', 'N30', 'N31', 'N32', 'N33'],
    core: ['N25', 'N26', 'N27', 'N28', 'N29', 'N30'],
    length: OLDER,
  },
];

export function missionLength(missionId: string): MissionLength {
  return ISLANDS[islandOf(missionId)]?.length ?? YOUNG;
}

export function islandOf(missionId: string): number {
  return ISLANDS.findIndex((i) => i.missions.includes(missionId));
}

/** Остров открыт, если взрослый начал с него или дальше, либо пройдено ядро предыдущего. */
export function islandOpen(attempts: Attempt[], index: number, startIsland = 0): boolean {
  if (index <= startIsland) return true;
  const prev = ISLANDS[index - 1];
  return islandOpen(attempts, index - 1, startIsland) && prev.core.every((id) => probeReached(attempts, id));
}

export function missionOpen(attempts: Attempt[], m: Mission, startIsland = 0): boolean {
  const island = islandOf(m.id);
  if (island < 0 || !islandOpen(attempts, island, startIsland)) return false;
  // На острове, с которого начали по решению взрослого, внутренние предпосылки
  // всё равно действуют: начинаем с первой миссии острова.
  return m.requires.every((r) => probeReached(attempts, r));
}

/** Миссии в порядке островов — так их показываем и предлагаем. */
export function orderedMissions(): Mission[] {
  return ISLANDS.flatMap((i) => i.missions.map((id) => getMission(id)!));
}

export function allMissionsPlaced(): boolean {
  const placed = ISLANDS.flatMap((i) => i.missions);
  return MISSIONS.every((m) => placed.filter((id) => id === m.id).length === 1);
}
