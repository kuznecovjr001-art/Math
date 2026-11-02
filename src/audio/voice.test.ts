import { describe, expect, it } from 'vitest';
import { onGameEvent, type GameEvent } from '../motion/events';
import { createVoice, type Clip } from './voice';

/** Поддельный звук: тест сам решает, когда запись «доиграла». */
class FakeClip implements Clip {
  static all: FakeClip[] = [];
  volume = 1;
  paused = true;
  private handlers: Record<string, (() => void)[]> = {};
  constructor(public src: string) { FakeClip.all.push(this); }
  addEventListener(t: string, h: () => void) { (this.handlers[t] ??= []).push(h); }
  play() { this.paused = false; this.fire('playing'); return Promise.resolve(); }
  pause() { this.paused = true; }
  fire(t: string) { for (const h of this.handlers[t] ?? []) h(); }
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function setup(recorded: string[]) {
  FakeClip.all = [];
  const events: GameEvent['type'][] = [];
  const off = onGameEvent((e) => events.push(e.type));
  const v = createVoice({ recorded: new Set(recorded), url: (k) => `/voice/${k}.ogg`, clip: (src) => new FakeClip(src), key: (t) => t });
  return { v, events, off };
}

describe('voice', () => {
  it('plays a recording and resolves when it really ends', async () => {
    const { v, events, off } = setup(['Привет']);
    let done = false;
    const p = v.speak('Привет').then(() => { done = true; });
    await flush();
    expect(FakeClip.all[0].src).toBe('/voice/Привет.ogg');
    expect(done).toBe(false);
    FakeClip.all[0].fire('ended');
    await p;
    expect(events).toEqual(['VOICE_STARTED', 'VOICE_FINISHED']);
    off();
  });

  it('a new phrase stops the previous one: never two voices at once', async () => {
    const { v, off } = setup(['a', 'b']);
    const first = v.speak('a');
    await flush();
    void v.speak('b');
    await flush();
    await first;
    expect(FakeClip.all[0].paused).toBe(true);
    expect(FakeClip.all[1].paused).toBe(false);
    off();
  });

  it('plays a queue in order with a pause between phrases', async () => {
    const { v, off } = setup(['a', 'b']);
    const p = v.speakAll(['a', 'b'], 1);
    await flush();
    expect(FakeClip.all).toHaveLength(1);
    FakeClip.all[0].fire('ended');
    await new Promise((r) => setTimeout(r, 5));
    expect(FakeClip.all[1].src).toBe('/voice/b.ogg');
    FakeClip.all[1].fire('ended');
    await p;
    off();
  });

  it('does not fall back to a robot voice: a phrase without a recording is reported and skipped', async () => {
    const { v, events, off } = setup([]);
    await v.speak('Нет записи');
    expect(FakeClip.all).toHaveLength(0);
    expect(v.missing()).toEqual(['Нет записи']);
    expect(events).toEqual([]);
    off();
  });

  it('respects the switch and the volume', async () => {
    const { v, off } = setup(['a']);
    v.setEnabled(false);
    await v.speak('a');
    expect(FakeClip.all).toHaveLength(0);
    v.setEnabled(true);
    v.setVolume(0.4);
    void v.speak('a');
    await flush();
    expect(FakeClip.all[0].volume).toBe(0.4);
    off();
  });

  it('a broken file finishes the phrase instead of hanging the game', async () => {
    const { v, off } = setup(['a']);
    const p = v.speak('a');
    await flush();
    FakeClip.all[0].fire('error');
    await p;
    off();
  });
});
