export type SkillId =
  | 'M01' | 'M02' | 'M03' | 'M04' | 'M05' | 'M06' | 'M07'
  | 'M08' | 'M09' | 'M10' | 'M11' | 'M12' | 'M13' | 'M14' | 'M15' | 'M16' | 'M17' | 'M18'
  | 'M19' | 'M20' | 'M21' | 'M22' | 'M23';

/** A — обучение, B — самостоятельная проба, C — отложенная проба (повтор). */
export type Variant = 'A' | 'B' | 'C';

export type Mode = 'learn' | 'probe' | 'review';

/** 0 — без помощи; 1 — наводящий вопрос; 2 — модель; 3 — разобранный пример. */
export type HelpLevel = 0 | 1 | 2 | 3;

export interface Attempt {
  id: string;
  profileId: string;
  missionId: string;
  /** Идентификатор карточки с версией, например M05-A03-B-v1. */
  cardId: string;
  variant: Variant;
  skill: SkillId;
  mode: Mode;
  correct: boolean;
  helpLevel: HelpLevel;
  answer: string;
  at: number;
  /** Заход в миссию (MissionSession.id). Нет у записей до 2026-10. */
  sessionId?: string;
  /** Номер карточки в заходе: вместе с sessionId определяет экземпляр карточки. */
  step?: number;
  /** Сколько неверных ответов на этой карточке было до этой попытки. */
  errorsBefore?: number;
  /** Промежуточный шаг многошаговой карточки (раскладка до итога): не ответ на карточку. */
  partial?: true;
}

/** Один заход в миссию: сколько карточек показано и дошёл ли ребёнок до конца. */
export interface MissionSession {
  id: string;
  profileId: string;
  missionId: string;
  mode: 'play' | 'review' | 'again';
  /** Заход по заданию взрослого. */
  assigned?: true;
  startedAt: number;
  cards: number;
  /** Сколько карточек ребёнок увидел (номер текущей + 1). */
  shown: number;
  finishedAt?: number;
}

export type SkillStatus =
  | 'none'
  | 'meeting'
  | 'withHelp'
  | 'independent'
  | 'solid'
  | 'confirmed';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  /** Остров, с которого взрослый решил начать (по текущим умениям, а не по возрасту). */
  startIsland?: number;
}

export interface AppData {
  version: 1;
  profiles: Profile[];
  attempts: Attempt[];
  /** Наклейки по профилям: id миссии, за которую получена наклейка. */
  stickers: Record<string, string[]>;
  settings: { voice: boolean };
  /** Заходы в миссии; нет у записей до 2026-10. */
  sessions?: MissionSession[];
}
