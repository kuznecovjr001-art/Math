import { gsap } from 'gsap';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Mood } from '../character';
import { childrenOf, type Rig, type RigNode } from './model';
import { RigSvg } from './RigSvg';
import SchetikRig, { PARTS, RIG } from './SchetikRig';

/**
 * Страница сборки Счётика — только в режиме разработки: npm run dev → http://localhost:5173/#rig.
 * Детали тянутся мышью (Shift — двигать сам рисунок относительно шарнира), стрелки сдвигают на 1 (Shift — на 10),
 * поверх можно положить образец позы. «Сохранить» пишет src/motion/rig/rig.json (vite.config.ts, rig-save).
 */
const REFS = import.meta.glob('/art-src/schetik/guide-*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const MOODS: Mood[] = ['idle', 'listening', 'speaking', 'thinking', 'greeting', 'happy', 'encourage', 'helping', 'celebrating', 'sleeping'];

const round = (n: number, k = 10) => Math.round(n * k) / k;

// На странице сборки время анимации — настоящее, даже когда вкладка рисует редко (скриншоты, фон).
gsap.ticker.lagSmoothing(0);

export function formatRig(rig: Rig): string {
  return `{\n${Object.entries(rig).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n}\n`;
}

export default function Studio() {
  const [rig, setRig] = useState<Rig>(() => structuredClone(RIG));
  const [sel, setSel] = useState('head');
  const [shown, setShown] = useState<Record<string, string>>({});
  const [ref, setRef] = useState(Object.keys(REFS).find((k) => k.includes('listen')) ?? '');
  const [refOpacity, setRefOpacity] = useState(0.35);
  const [mode, setMode] = useState<'build' | 'play'>('build');
  const [mood, setMood] = useState<Mood>('idle');
  const [talk, setTalk] = useState(false);
  const [status, setStatus] = useState('');
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; vo: string | null; inv: DOMMatrix; x0: number; y0: number; nx: number; ny: number } | null>(null);

  const node = rig[sel];
  const variant = shown[sel] ?? node?.parts?.[0];
  const update = (id: string, patch: Partial<RigNode>) => setRig((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
  const setVo = (id: string, part: string, i: number, v: number) => setRig((r) => {
    const vo = { ...r[id].vo };
    const cur: [number, number, number] = [...(vo[part] ?? [0, 0, 0])];
    cur[i] = v;
    vo[part] = cur;
    return { ...r, [id]: { ...r[id], vo } };
  });

  // Стрелки двигают выбранную деталь.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      if (!dx && !dy) return;
      e.preventDefault();
      setRig((r) => ({ ...r, [sel]: { ...r[sel], x: round(r[sel].x + dx), y: round(r[sel].y + dy) } }));
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [sel]);

  function down(e: React.PointerEvent) {
    if (mode !== 'build') return;
    const g = (e.target as Element).closest<SVGGElement>('[data-node]');
    if (!g) return;
    const id = g.dataset.node!;
    setSel(id);
    const vo = e.shiftKey ? (shown[id] ?? rig[id].parts?.[0] ?? null) : null;
    // Перетаскиваем в системе родителя (для узла) или самого узла (для рисунка).
    const frame = vo ? g : (g.parentElement as unknown as SVGGraphicsElement);
    const m = frame.getScreenCTM();
    if (!m) return;
    const [nx, ny] = vo ? (rig[id].vo?.[vo] ?? [0, 0]) : [rig[id].x, rig[id].y];
    drag.current = { id, vo, inv: m.inverse(), x0: e.clientX, y0: e.clientY, nx, ny };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    const s = drag.current;
    if (!s) return;
    const a = new DOMPoint(s.x0, s.y0).matrixTransform(s.inv);
    const b = new DOMPoint(e.clientX, e.clientY).matrixTransform(s.inv);
    const x = round(s.nx + b.x - a.x);
    const y = round(s.ny + b.y - a.y);
    if (s.vo) { setVo(s.id, s.vo, 0, x); setVo(s.id, s.vo, 1, y); } else update(s.id, { x, y });
  }

  async function save() {
    const r = await fetch('/__rig-save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: formatRig(rig) }).catch(() => null);
    setStatus(r?.ok ? 'Сохранено в rig.json' : 'Не сохранилось — скопируйте JSON');
  }

  const tree = useMemo(() => {
    const out: { id: string; depth: number }[] = [];
    const walk = (p: string | undefined, depth: number) => childrenOf(rig, p).forEach((id) => { out.push({ id, depth }); walk(id, depth + 1); });
    walk(undefined, 0);
    return out;
  }, [rig]);

  const num = (label: string, value: number, set: (v: number) => void, step = 1) => (
    <label style={{ display: 'grid', gridTemplateColumns: '3em 1fr', gap: 4, alignItems: 'center' }}>
      {label}
      <input type="number" step={step} value={value} onChange={(e) => set(Number(e.target.value))} style={{ width: '100%' }} />
    </label>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, padding: 16, font: '14px system-ui', background: '#f4f1ea', minHeight: '100vh', color: '#222' }}>
      <div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <button onClick={() => setMode('build')} disabled={mode === 'build'}>Сборка</button>
          <button onClick={() => setMode('play')} disabled={mode === 'play'}>Анимация</button>
          {mode === 'play' && MOODS.map((m) => <button key={m} onClick={() => setMood(m)} disabled={m === mood}>{m}</button>)}
          {mode === 'play' && <label><input type="checkbox" checked={talk} onChange={(e) => setTalk(e.target.checked)} /> говорит</label>}
        </div>
        <div ref={stage} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }}
          style={{ position: 'relative', width: 'min(80vh, 100%)', aspectRatio: '1', background: '#fff', border: '1px solid #ccc', touchAction: 'none' }}>
          {mode === 'build'
            ? <RigSvg rig={rig} parts={PARTS} shown={shown} className="studio-rig" viewBox="0 0 1024 1024" />
            : <SchetikRig rig={rig} mood={mood} voice={talk} viewBox="0 0 1024 1024" />}
          {ref && <img src={REFS[ref]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: refOpacity, pointerEvents: 'none' }} />}
        </div>
        <style>{`.studio-rig { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
          .studio-rig [data-node="${sel}"] > [data-v]:not([display]) { outline: 2px dashed #e33; }`}</style>
      </div>
      <aside style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <label>Образец{' '}
          <select value={ref} onChange={(e) => setRef(e.target.value)}>
            <option value="">— нет —</option>
            {Object.keys(REFS).map((k) => <option key={k} value={k}>{k.split('/').pop()}</option>)}
          </select>
        </label>
        <input type="range" min={0} max={1} step={0.05} value={refOpacity} onChange={(e) => setRefOpacity(Number(e.target.value))} />
        <div style={{ maxHeight: 220, overflow: 'auto', background: '#fff', border: '1px solid #ccc' }}>
          {tree.map(({ id, depth }) => (
            <div key={id} onClick={() => setSel(id)} style={{ paddingLeft: 8 + depth * 14, cursor: 'pointer', background: id === sel ? '#ffe08a' : undefined }}>{id}</div>
          ))}
        </div>
        {node && (
          <fieldset style={{ display: 'grid', gap: 4 }}>
            <legend>{sel}</legend>
            {num('x', node.x, (v) => update(sel, { x: v }))}
            {num('y', node.y, (v) => update(sel, { y: v }))}
            {num('rot', node.rot, (v) => update(sel, { rot: v }))}
            {num('s', node.s, (v) => update(sel, { s: v }), 0.01)}
            {num('z', node.z, (v) => update(sel, { z: v }))}
            {node.parts && node.parts.length > 1 && (
              <select value={variant} onChange={(e) => setShown((s) => ({ ...s, [sel]: e.target.value }))}>
                {node.parts.map((p) => <option key={p}>{p}</option>)}
              </select>
            )}
            {variant && variant !== 'strap' && (
              <>
                <small>Рисунок «{variant}» от шарнира (Shift + тянуть):</small>
                {(['dx', 'dy', 'rot'] as const).map((l, i) => <div key={l}>{num(l, node.vo?.[variant]?.[i] ?? 0, (v) => setVo(sel, variant, i, v))}</div>)}
              </>
            )}
          </fieldset>
        )}
        <button onClick={save}>Сохранить</button>
        <button onClick={() => navigator.clipboard.writeText(formatRig(rig)).then(() => setStatus('JSON скопирован'))}>Скопировать JSON</button>
        <button onClick={() => setRig(structuredClone(RIG))}>Вернуть из файла</button>
        <small>{status}</small>
      </aside>
    </div>
  );
}
