import { gsap } from 'gsap';
import type { Mood } from '../character';
import { nodeTransform, ZERO, type Delta, type Parts, type Rig } from './model';

export type MotionLevel = 'full' | 'moderate' | 'minimal';

/** Выражение лица и жесты кистей. */
interface Face { eye: 'open' | 'half' | 'closed'; brow: 'calm' | 'happy' | 'think'; mouth: Mouth; scarf?: 'scarf' | 'scarf-wind' }
type Mouth = 'smile' | 'wide' | 'a' | 'o' | 'u' | 'm';

const FACE: Record<Mood, Face> = {
  idle: { eye: 'open', brow: 'calm', mouth: 'smile' },
  listening: { eye: 'open', brow: 'calm', mouth: 'smile' },
  speaking: { eye: 'open', brow: 'calm', mouth: 'smile' },
  thinking: { eye: 'open', brow: 'think', mouth: 'm' },
  greeting: { eye: 'open', brow: 'happy', mouth: 'wide' },
  happy: { eye: 'open', brow: 'happy', mouth: 'wide' },
  celebrating: { eye: 'closed', brow: 'happy', mouth: 'a', scarf: 'scarf-wind' },
  encourage: { eye: 'open', brow: 'calm', mouth: 'smile' },
  helping: { eye: 'open', brow: 'calm', mouth: 'o' },
  pointing: { eye: 'open', brow: 'calm', mouth: 'smile' },
  sleeping: { eye: 'closed', brow: 'calm', mouth: 'smile' },
};

/** Куда смотрят зрачки: -1…1 по каждой оси. */
const LOOK: Partial<Record<Mood, [number, number]>> = {
  listening: [0, 0.25], thinking: [-0.6, -0.6], helping: [0.8, 0.1], pointing: [0.8, 0.1], encourage: [0, 0.2],
};

/** Формы рта, пока звучит фраза: рот «говорит» сменой форм, пауза — сомкнутые губы. */
const TALK: Mouth[] = ['a', 'o', 'm', 'a', 'u', 'wide', 'm', 'o'];

type Pose = (tl: gsap.core.Timeline, d: Record<string, Delta>) => void;

/** Разовое движение входа в состояние. В «минимальном» уровне сразу показывается его конец. */
const ENTER: Partial<Record<Mood, Pose>> = {
  greeting: (tl, d) => {
    tl.to(d.armL, { rot: 115, duration: 0.3, ease: 'back.out(1.6)' })
      .to(d.armL, { rot: 92, duration: 0.18, yoyo: true, repeat: 5, ease: 'sine.inOut' })
      .to(d.armL, { rot: 0, duration: 0.35, ease: 'power2.inOut' });
  },
  happy: (tl, d) => {
    tl.to(d.root, { y: -50, sy: 1.04, duration: 0.22, ease: 'power2.out' })
      .to(d.armL, { rot: 35, duration: 0.22 }, '<')
      .to(d.armR, { rot: -35, duration: 0.22 }, '<')
      .to(d.root, { y: 0, sy: 1, duration: 0.3, ease: 'bounce.out' })
      .to([d.armL, d.armR], { rot: 0, duration: 0.4 }, '<0.1');
  },
  celebrating: (tl, d) => {
    // Ласты вверх и в стороны (углы — сверх покоя ±22°): дальше они уходят за голову.
    tl.to(d.armL, { rot: 100, duration: 0.25, ease: 'back.out(1.5)' })
      .to(d.armR, { rot: -100, duration: 0.25, ease: 'back.out(1.5)' }, '<')
      .to(d.root, { y: -80, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 3 }, '<')
      .to(d.head, { rot: 4, duration: 0.25, yoyo: true, repeat: 3 }, '<');
  },
  encourage: (tl, d) => {
    tl.to(d.head, { rot: 5, y: 8, duration: 0.25, ease: 'sine.inOut', yoyo: true, repeat: 3 });
  },
  helping: (tl, d) => {
    // Ласт показывает кончиком: вытягивается вбок и дважды «тычет» в сторону подсказки.
    tl.to(d.armR, { rot: -75, duration: 0.35, ease: 'back.out(1.4)' })
      .to(d.head, { rot: 5, duration: 0.35 }, '<')
      .to(d.armR, { rot: -66, duration: 0.15, yoyo: true, repeat: 3, ease: 'sine.inOut' });
  },
  thinking: (tl, d) => {
    tl.to(d.head, { rot: 7, duration: 0.6, ease: 'power2.out' });
  },
  listening: (tl, d) => {
    tl.to(d.head, { rot: -5, duration: 0.5, ease: 'power2.out' });
  },
  sleeping: (tl, d) => {
    tl.to(d.head, { rot: 8, y: 20, duration: 1.2, ease: 'sine.inOut' })
      .to(d.armL, { rot: -6, duration: 1.2 }, '<')
      .to(d.armR, { rot: 6, duration: 1.2 }, '<');
  },
};
ENTER.pointing = ENTER.helping;

/** Повторяющееся движение, пока держится состояние (только полный уровень движения). */
const LOOP: Partial<Record<Mood, Pose>> = {
  idle: (tl, d) => breathe(tl, d, 1.8),
  listening: (tl, d) => breathe(tl, d, 1.8),
  thinking: (tl, d) => breathe(tl, d, 2.2),
  speaking: (tl, d) => {
    breathe(tl, d, 1.6);
    tl.to(d.head, { rot: 2, duration: 0.45, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  },
  sleeping: (tl, d) => breathe(tl, d, 3, 1.035),
};

function breathe(tl: gsap.core.Timeline, d: Record<string, Delta>, period: number, amount = 1.018) {
  tl.to(d.body, { sy: amount, sx: 2 - amount, duration: period, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0)
    .to(d.head, { y: -6, duration: period, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0)
    .to(d.armL, { rot: 2, duration: period, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0)
    .to(d.armR, { rot: -2, duration: period, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
}

/**
 * Оживляет SVG рига (RigSvg): состояние Счётика → выражение, поза, взгляд, моргание и рот под голос.
 * GSAP анимирует только числа смещений, а запись в transform — одна на кадр и только если что-то менялось.
 */
export function createRigAnimator(svg: SVGSVGElement, rig: Rig, parts: Parts, level: () => MotionLevel) {
  const ids = Object.keys(rig);
  const nodes = new Map(ids.map((id) => [id, svg.querySelector<SVGGElement>(`g[data-node="${id}"]`)!]));
  const d: Record<string, Delta> = Object.fromEntries(ids.map((id) => [id, { ...ZERO }]));
  const look = { x: 0, y: 0 };
  const shown: Record<string, string> = {};
  let dirty = true;
  let face: Face = FACE.idle;
  let talking = false;
  let moodTl: gsap.core.Timeline | null = null;
  let loopTl: gsap.core.Timeline | null = null;
  let talkCall: gsap.core.Tween | null = null;
  let blinkCall: gsap.core.Tween | null = null;
  let blinkTl: gsap.core.Timeline | null = null;

  const pupils = [...svg.querySelectorAll<SVGGElement>('[data-pupil]')];
  // Насколько далеко зрачок может уйти от центра: треть белка.
  const reach = (['eye-open-L', 'eye-open-R'] as const).map((k) => parts[k]?.clip ?? [0, 0, 0, 0]);
  const [rx, ry] = [reach[0][2] * 0.33, reach[0][3] * 0.3];

  function render() {
    if (!dirty) return;
    dirty = false;
    for (const id of ids) nodes.get(id)?.setAttribute('transform', nodeTransform(rig[id], d[id]));
    const t = `translate(${(look.x * rx).toFixed(1)} ${(look.y * ry).toFixed(1)})`;
    for (const p of pupils) p.setAttribute('transform', t);
  }
  const mark = () => { dirty = true; };
  gsap.ticker.add(render);

  function show(id: string, part: string) {
    const g = nodes.get(id);
    if (!g || shown[id] === part) return;
    shown[id] = part;
    for (const v of g.querySelectorAll<SVGGElement>(':scope > [data-v]')) {
      if (v.dataset.v === part) v.removeAttribute('display'); else v.setAttribute('display', 'none');
    }
  }
  const showMouth = (m: Mouth) => show('mouth', `mouth-${m}`);
  const showEyes = (e: Face['eye']) => { show('eyeL', `eye-${e}-L`); show('eyeR', `eye-${e}-R`); };

  function applyFace(f: Face) {
    face = f;
    showEyes(f.eye);
    show('browL', `brow-${f.brow}-L`);
    show('browR', `brow-${f.brow}-R`);
    if (!talking) showMouth(f.mouth);
    show('scarf', f.scarf ?? 'scarf');
  }

  function blinkLater() {
    blinkCall?.kill();
    if (level() === 'minimal') return;
    blinkCall = gsap.delayedCall(2.5 + Math.random() * 3.5, () => {
      if (face.eye === 'open') {
        blinkTl = gsap.timeline()
          .call(() => showEyes('half')).call(() => showEyes('closed'), [], 0.05)
          .call(() => showEyes('half'), [], 0.13).call(() => showEyes(face.eye), [], 0.18);
      }
      blinkLater();
    });
  }

  function play(next: Mood) {
    moodTl?.kill();
    loopTl?.kill();
    const lv = level();
    applyFace(FACE[next]);
    const [lx, ly] = LOOK[next] ?? [0, 0];
    // Возврат в покой и вход в новое состояние идут одной цепочкой.
    moodTl = gsap.timeline({ defaults: { onUpdate: mark } });
    moodTl.to(Object.values(d), { ...ZERO, duration: lv === 'minimal' ? 0 : 0.25, ease: 'power2.out' });
    moodTl.to(look, { x: lx, y: ly, duration: lv === 'minimal' ? 0 : 0.3 }, 0);
    ENTER[next]?.(moodTl, d);
    if (lv === 'minimal') { moodTl.progress(1); mark(); return; }
    const loop = LOOP[next];
    if (loop && lv === 'full') {
      moodTl.call(() => {
        loopTl = gsap.timeline({ defaults: { onUpdate: mark } });
        loop(loopTl, d);
      });
    }
  }

  function setTalking(on: boolean) {
    if (on === talking) return;
    talking = on;
    talkCall?.kill();
    if (!on || level() === 'minimal') { showMouth(face.mouth); return; }
    let i = Math.floor(Math.random() * TALK.length);
    const step = () => {
      showMouth(TALK[i++ % TALK.length]);
      talkCall = gsap.delayedCall(0.08 + Math.random() * 0.07, step);
    };
    step();
  }

  applyFace(face);
  blinkLater();

  return {
    play,
    setTalking,
    /** Взгляд на точку: -1…1 по осям (страница сборки и подсказки «посмотри сюда»). */
    lookAt(x: number, y: number) { gsap.to(look, { x, y, duration: 0.3, onUpdate: mark }); },
    destroy() {
      for (const t of [moodTl, loopTl, talkCall, blinkCall, blinkTl]) t?.kill();
      gsap.ticker.remove(render);
    },
  };
}

export type RigAnimator = ReturnType<typeof createRigAnimator>;
