/**
 * Где на рисунке острова стоят камни миссий: центр площадки в процентах от ширины и высоты.
 * Координаты сняты с фонов bg/map-*-land (3 : 2) и bg/map-*-port (2 : 3): центры песчаных площадок
 * находит scripts/art/maps.py.
 * Миссии, для которых на рисунке нет площадки, идут полосой «Ещё задания» под картой.
 */
export type Point = [number, number];
export interface Stop { id: string; land: Point; port: Point }

export const MAP_STOPS: Record<string, Stop[]> = {
  count: [
    { id: 'A01', land: [22, 64], port: [35, 72] },
    { id: 'A02', land: [39, 50], port: [49, 53] },
    { id: 'N01', land: [63, 39], port: [49, 35] },
    { id: 'N02', land: [78, 24], port: [68, 17] },
  ],
  compose: [
    { id: 'A03', land: [21, 39], port: [50, 18] },
    { id: 'N03', land: [42, 41], port: [47, 36] },
    { id: 'A04', land: [60, 41], port: [47, 57] },
    { id: 'N04', land: [81, 46], port: [49, 78] },
  ],
  ten: [
    { id: 'N05', land: [25, 46], port: [48, 27] },
    { id: 'N06', land: [50, 44], port: [46, 50] },
    { id: 'N07', land: [76, 53], port: [53, 69] },
  ],
  groups: [
    { id: 'A05', land: [34, 29], port: [34, 25] },
    { id: 'A06', land: [64, 29], port: [68, 30] },
    { id: 'A11', land: [35, 58], port: [65, 55] },
    { id: 'N08', land: [64, 58], port: [34, 48] },
  ],
  table: [
    { id: 'T02', land: [46, 82], port: [43, 75] },
    { id: 'T05', land: [53, 72], port: [63, 67] },
    { id: 'T01', land: [45, 63], port: [43, 60] },
    { id: 'T04', land: [61, 55], port: [63, 53] },
    { id: 'T03', land: [51, 48], port: [46, 46] },
    { id: 'T09', land: [42, 41], port: [66, 39] },
    { id: 'T06', land: [52, 34], port: [45, 32] },
    { id: 'T78', land: [65, 28], port: [62, 27] },
    { id: 'S01', land: [57, 23], port: [54, 19] },
  ],
  // На карте сотен площадок нет: камни идут зигзагом по зелёной середине, не заходя на причалы.
  hundreds: [
    { id: 'N25', land: [20, 64], port: [36, 74] },
    { id: 'N26', land: [28, 42], port: [64, 67] },
    { id: 'N27', land: [35, 64], port: [36, 60] },
    { id: 'N28', land: [42, 42], port: [64, 54] },
    { id: 'N29', land: [50, 64], port: [36, 47] },
    { id: 'N30', land: [58, 42], port: [64, 40] },
    { id: 'N31', land: [65, 64], port: [36, 34] },
    { id: 'N32', land: [72, 42], port: [64, 27] },
    { id: 'N33', land: [80, 64], port: [36, 20] },
  ],
};

/** Карта, на которой площадок нет: камни идут зигзагом по всему острову, не налезая друг на друга. */
export function snakeStops(ids: string[]): Stop[] {
  const n = ids.length;
  return ids.map((id, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const side = i % 2 === 0;
    return {
      id,
      land: [Math.round(12 + t * 76), side ? 64 : 36],
      port: [side ? 34 : 66, Math.round(90 - t * 80)],
    };
  });
}
