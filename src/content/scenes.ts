/**
 * Фон сцены для каждой миссии: имя из ТЗ на графику, файлы bg/<имя>-land и bg/<имя>-port.
 * Пока фона нет, экран остаётся на обычном тёплом фоне.
 */
export const MISSION_SCENE: Record<string, string> = {
  A01: 'tea', A02: 'orchard', N01: 'meadow', N02: 'meadow',
  N09: 'table', N10: 'picnic', N11: 'shapes', N12: 'meadow', N13: 'table',
  A03: 'station', N03: 'picnic', A04: 'warehouse', N04: 'shapes',
  N14: 'picnic', N15: 'warehouse', N16: 'meadow',
  N05: 'bakery', N06: 'bakery', N07: 'forest',
  N17: 'forest', N18: 'classroom', N19: 'shop', N20: 'orchard',
  A05: 'packing', A06: 'packing', A11: 'garden-plot', N08: 'tea',
  N21: 'packing', N22: 'meadow', N23: 'bakery', N24: 'shapes',
  T02: 'classroom', T05: 'classroom', T01: 'classroom', T04: 'classroom', T03: 'classroom',
  T09: 'classroom', T06: 'classroom', T78: 'classroom', S01: 'library',
  N25: 'workshop', N26: 'workshop', N27: 'library', N28: 'workshop', N29: 'workshop',
  N30: 'library', N31: 'workshop', N32: 'classroom', N33: 'shop',
};

/** Запасной фон, если своего у сцены ещё нет: лавка и мастерская уже нарисованы, запас нужен только без файла. */
export const SCENE_FALLBACK: Record<string, string> = { shop: 'bakery', workshop: 'classroom' };
