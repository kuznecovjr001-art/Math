import { describe, expect, it } from 'vitest';
import type { Attempt } from '../engine/types';
import { allMissionsPlaced, ISLANDS, islandOf, islandOpen, missionOpen } from './levels';
import { getMission, MISSIONS } from './missions';

let n = 0;
const done = (missionId: string): Attempt => {
  n += 1;
  return {
    id: `x${n}`, profileId: 'p', missionId, cardId: 'c', variant: 'B', skill: 'M01',
    mode: 'probe', correct: true, helpLevel: 0, answer: '', at: 0,
  };
};

describe('levels', () => {
  it('places every mission on exactly one island', () => {
    expect(allMissionsPlaced()).toBe(true);
  });

  it('keeps prerequisites on the same island and before the mission', () => {
    for (const island of ISLANDS) {
      for (const id of island.missions) {
        for (const r of getMission(id)!.requires) {
          expect(island.missions).toContain(r);
          expect(island.missions.indexOf(r)).toBeLessThan(island.missions.indexOf(id));
        }
      }
      for (const c of island.core) expect(island.missions).toContain(c);
    }
  });

  it('opens only the first island at the start', () => {
    expect(islandOpen([], 0)).toBe(true);
    expect(islandOpen([], 1)).toBe(false);
  });

  it('opens the next island after the core of the previous one', () => {
    const list = ISLANDS[0].core.map(done);
    expect(islandOpen(list, 1)).toBe(true);
    expect(islandOpen(list, 2)).toBe(false);
  });

  it('does not let the parallel shapes branch block the path', () => {
    const list = [...ISLANDS[0].core, ...ISLANDS[1].core].map(done);
    expect(ISLANDS[1].core).not.toContain('N04');
    expect(islandOpen(list, 2)).toBe(true);
  });

  it('lets an adult start from a later island', () => {
    const t02 = getMission('T02')!;
    expect(missionOpen([], t02)).toBe(false);
    expect(missionOpen([], t02, islandOf('T02'))).toBe(true);
    expect(missionOpen([], getMission('T05')!, islandOf('T02'))).toBe(false);
  });

  it('describes skills from M01 to M14 except reading-only topics', () => {
    const skills = new Set(MISSIONS.map((m) => m.skill));
    for (const s of ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M13', 'M14']) {
      expect(skills).toContain(s);
    }
  });
});
