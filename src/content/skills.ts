import type { SkillId, SkillStatus } from '../engine/types';

/** Карта навыков из материалов проекта (документ «Математика — карта навыков»). */
export const SKILLS: Record<SkillId, { title: string; requires: SkillId[] }> = {
  M01: { title: 'Один предмет каждому', requires: [] },
  M02: { title: 'Счёт и итоговое количество', requires: ['M01'] },
  M03: { title: 'Количество и цифра', requires: ['M02'] },
  M04: { title: 'Больше, меньше, поровну', requires: ['M01'] },
  M05: { title: 'Состав числа', requires: ['M02', 'M04'] },
  M06: { title: 'Сложение и вычитание', requires: ['M05'] },
  M07: { title: 'Десяток и крупные количества', requires: ['M03', 'M06'] },
  M08: { title: 'Пространство, форма и измерение', requires: [] },
  M09: { title: 'Равные группы', requires: ['M02', 'M04', 'M06'] },
  M10: { title: 'Смысл записи умножения', requires: ['M09'] },
  M11: { title: 'Связи произведений', requires: ['M10'] },
  M12: { title: 'Таблица 1–10', requires: ['M11'] },
  M13: { title: 'Распределение и неизвестное', requires: ['M09'] },
  M14: { title: 'Самостоятельное применение', requires: [] },
  // Добавлено по учебникам NCERT (Индия): Joyful Mathematics 1 и Maths Mela 3.
  M15: { title: 'Расположение: на, под, в, рядом', requires: [] },
  M16: { title: 'Группировка и закономерности', requires: [] },
  M17: { title: 'Длина и масса: сравнение', requires: ['M04'] },
  M18: { title: 'Время: части суток и порядок', requires: [] },
  M19: { title: 'Деньги: монеты и сдача', requires: ['M06'] },
  M20: { title: 'Данные: сбор и сравнение', requires: ['M02', 'M04'] },
  M21: { title: 'Числа до 1000: сотни, десятки, единицы', requires: ['M07'] },
  M22: { title: 'Доли: половина и четверть', requires: ['M09'] },
  M23: { title: 'Симметрия и узоры', requires: ['M08'] },
};

export const STATUS_TEXT: Record<SkillStatus, string> = {
  none: 'Ещё не встречали',
  meeting: 'Знакомится',
  withHelp: 'Получается с помощью или со второй попытки',
  independent: 'Есть самостоятельный успех',
  solid: 'Уверенно, в разные дни',
  confirmed: 'Подтверждено после паузы',
};
