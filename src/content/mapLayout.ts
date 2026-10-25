/**
 * Где на рисунке острова стоят камни миссий: центр площадки в процентах от ширины и высоты.
 * Координаты сняты с фонов bg/map-*-land (3 : 2) и bg/map-*-port (2 : 3) из комплекта «Остров счёта».
 * Миссии, для которых на рисунке нет площадки, идут полосой «Ещё задания» под картой.
 */
export type Point = [number, number];
export interface Stop { id: string; land: Point; port: Point }

export const MAP_STOPS: Record<string, Stop[]> = {
  count: [
    { id: 'A01', land: [22, 63], port: [35, 73] },
    { id: 'A02', land: [39, 50], port: [50, 51] },
    { id: 'N01', land: [62, 39], port: [48, 36] },
    { id: 'N02', land: [77, 24], port: [68, 16] },
  ],
  compose: [
    { id: 'A03', land: [20, 40], port: [48, 16] },
    { id: 'N03', land: [37, 40], port: [44, 35] },
    { id: 'A04', land: [56, 40], port: [45, 55] },
    { id: 'N04', land: [76, 43], port: [48, 77] },
  ],
  ten: [
    { id: 'N05', land: [25, 47], port: [44, 26] },
    { id: 'N06', land: [51, 44], port: [48, 50] },
    { id: 'N07', land: [78, 53], port: [53, 69] },
  ],
  groups: [
    { id: 'A05', land: [36, 25], port: [28, 25] },
    { id: 'A06', land: [65, 25], port: [67, 28] },
    { id: 'A11', land: [35, 57], port: [69, 57] },
    { id: 'N08', land: [66, 57], port: [32, 50] },
  ],
  table: [
    { id: 'T02', land: [46, 82], port: [42, 75] },
    { id: 'T05', land: [53, 72], port: [60, 66] },
    { id: 'T01', land: [45, 63], port: [44, 59] },
    { id: 'T04', land: [61, 55], port: [62, 53] },
    { id: 'T03', land: [51, 48], port: [46, 46] },
    { id: 'T09', land: [42, 41], port: [63, 39] },
    { id: 'T06', land: [52, 34], port: [46, 32] },
    { id: 'T78', land: [65, 28], port: [63, 26] },
    { id: 'S01', land: [57, 23], port: [54, 19] },
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
