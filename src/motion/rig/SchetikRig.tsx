import { useEffect, useRef } from 'react';
import type { Mood } from '../character';
import { motionOff } from '../flight';
import { createRigAnimator, type MotionLevel, type RigAnimator } from './animate';
import type { Parts, Rig } from './model';
import partsJson from './parts.json';
import rigJson from './rig.json';
import { RigSvg } from './RigSvg';

export const PARTS = partsJson as unknown as Parts;
export const RIG = rigJson as unknown as Rig;

export function motionLevel(): MotionLevel {
  if (motionOff()) return 'minimal';
  return document.documentElement.dataset.motion === 'moderate' ? 'moderate' : 'full';
}

/** Векторный Счётик (отдельный чанк): состояние → поза и выражение, голос → рот. */
export default function SchetikRig({ mood, voice, rig = RIG, viewBox }: { mood: Mood; voice: boolean; rig?: Rig; viewBox?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const anim = useRef<RigAnimator | null>(null);
  const moodRef = useRef(mood);
  moodRef.current = mood;

  useEffect(() => {
    const svg = box.current!.querySelector('svg')!;
    const a = createRigAnimator(svg, rig, PARTS, motionLevel);
    a.play(moodRef.current);
    anim.current = a;
    return () => { a.destroy(); anim.current = null; };
  }, [rig]);

  useEffect(() => { anim.current?.play(mood); }, [mood]);
  useEffect(() => { anim.current?.setTalking(voice); }, [voice]);

  return (
    <div ref={box} className="schetik-rig">
      <RigSvg rig={rig} parts={PARTS} viewBox={viewBox} />
    </div>
  );
}
