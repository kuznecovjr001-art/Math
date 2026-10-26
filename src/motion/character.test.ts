import { describe, expect, it } from 'vitest';
import { CHARACTER_IDLE, characterStep, poseOf, type CharacterState } from './character';

const at = (s: CharacterState, ms: number) => characterStep(s, { type: 'TICK' }, ms);
/** Идёт задание: базовое состояние — «слушает». */
const TASK = characterStep(CHARACTER_IDLE, { type: 'TASK_STARTED', first: false }, 0);

describe('characterStep', () => {
  it('starts idle and greets once when a task starts', () => {
    const s = characterStep(CHARACTER_IDLE, { type: 'TASK_STARTED', first: true }, 0);
    expect(s.mood).toBe('greeting');
    expect(characterStep(CHARACTER_IDLE, { type: 'TASK_STARTED', first: false }, 0).mood).toBe('listening');
  });

  it('speaks while the voice plays and returns to the base mood after it', () => {
    let s = characterStep(TASK, { type: 'VOICE_STARTED', emotion: 'explain' }, 0);
    expect(s.mood).toBe('speaking');
    s = characterStep(s, { type: 'VOICE_FINISHED' }, 2000);
    expect(s.mood).toBe('listening');
  });

  it('lets a correct answer interrupt speaking, then calms down by itself', () => {
    let s = characterStep(TASK, { type: 'VOICE_STARTED', emotion: 'explain' }, 0);
    s = characterStep(s, { type: 'ANSWER_CORRECT', final: true }, 100);
    expect(s.mood).toBe('happy');
    // Похвала голосом не перебивает радость, а следующая инструкция — да, после её минимального времени.
    s = characterStep(s, { type: 'VOICE_STARTED', emotion: 'praise' }, 150);
    expect(s.mood).toBe('happy');
    // Радость закончилась, а похвала ещё звучит — Счётик договаривает.
    expect(at(s, 100 + 2000).mood).toBe('speaking');
    s = characterStep(s, { type: 'VOICE_FINISHED' }, 1500);
    expect(at(s, 100 + 2000).mood).toBe('listening');
  });

  it('does not let a low-priority event cancel a high-priority mood', () => {
    let s = characterStep(CHARACTER_IDLE, { type: 'MISSION_COMPLETED' }, 0);
    s = characterStep(s, { type: 'OBJECT_PICKED' }, 50);
    expect(s.mood).toBe('celebrating');
  });

  it('encourages after a mistake and helps on request', () => {
    expect(characterStep(CHARACTER_IDLE, { type: 'ANSWER_INCORRECT' }, 0).mood).toBe('encourage');
    expect(characterStep(CHARACTER_IDLE, { type: 'HELP_REQUESTED', level: 2 }, 0).mood).toBe('helping');
  });

  it('thinks after a pause and falls asleep after a long one, and wakes on any touch', () => {
    let s = characterStep(CHARACTER_IDLE, { type: 'TASK_STARTED', first: false }, 0);
    s = at(s, 2000);
    expect(s.mood).toBe('listening');
    s = at(s, 20_000);
    expect(s.mood).toBe('thinking');
    s = at(s, 95_000);
    expect(s.mood).toBe('sleeping');
    s = characterStep(s, { type: 'OBJECT_PICKED' }, 95_100);
    expect(s.mood).toBe('listening');
  });

  it('is deterministic: the same events give the same states', () => {
    const run = () => [
      { type: 'TASK_STARTED', first: true }, { type: 'VOICE_STARTED', emotion: 'explain' },
      { type: 'ANSWER_INCORRECT' }, { type: 'VOICE_FINISHED' },
    ].reduce<CharacterState>((s, e, i) => characterStep(s, e as never, i * 500), CHARACTER_IDLE);
    expect(run()).toEqual(run());
  });

  it('maps every mood to one of the drawn poses', () => {
    for (const m of ['idle', 'greeting', 'listening', 'thinking', 'speaking', 'helping', 'happy',
      'encourage', 'pointing', 'celebrating', 'sleeping'] as const) {
      expect(['idle', 'talk', 'help', 'happy', 'think']).toContain(poseOf(m));
    }
  });
});
