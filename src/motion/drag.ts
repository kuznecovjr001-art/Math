import { useRef } from 'react';
import { DUR, EASE } from './tokens';
import { emit } from './events';
import { motionOff } from './flight';

/** Детская рука неточна: зона засчитывается и с промахом на столько пикселей вокруг. */
const SLOP = 28;

function zoneAt(x: number, y: number): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>('[data-drop-zone]')) {
    const r = el.getBoundingClientRect();
    if (x >= r.left - SLOP && x <= r.right + SLOP && y >= r.top - SLOP && y <= r.bottom + SLOP) return el;
  }
  return null;
}

/**
 * Перетаскивание пальцем к зоне [data-drop-zone="i"] (Pointer Events, без hover). Предмет идёт за пальцем,
 * зона под пальцем подсвечивается (.near), отпускание в зоне — onDrop(i), мимо — предмет плавно возвращается.
 * Касание по зоне по-прежнему работает: перетаскивание — дополнительный способ.
 */
export function useDragToZone(onDrop: (zone: number) => void, disabled: boolean) {
  const st = useRef<{ x: number; y: number; el: HTMLElement; near: HTMLElement | null } | null>(null);
  const setNear = (z: HTMLElement | null) => {
    const s = st.current;
    if (!s || s.near === z) return;
    s.near?.classList.remove('near');
    z?.classList.add('near');
    s.near = z;
  };
  return {
    onPointerDown(e: React.PointerEvent<HTMLElement>) {
      if (disabled) return;
      // Предмет мог ещё возвращаться после промаха: возврат прерываем, иначе он не пойдёт за пальцем.
      e.currentTarget.getAnimations?.().forEach((a) => a.cancel());
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* без захвата тоже работает */ }
      st.current = { x: e.clientX, y: e.clientY, el: e.currentTarget, near: null };
      e.currentTarget.classList.add('dragging');
      emit({ type: 'OBJECT_PICKED' });
    },
    onPointerMove(e: React.PointerEvent<HTMLElement>) {
      const s = st.current;
      if (!s) return;
      // Внутри увеличенной или уменьшенной сцены (CSS zoom) сдвиг пересчитываем, чтобы предмет шёл ровно под пальцем.
      const z = (s.el as HTMLElement & { currentCSSZoom?: number }).currentCSSZoom || 1;
      s.el.style.transform = `translate(${(e.clientX - s.x) / z}px, ${(e.clientY - s.y) / z}px) scale(1.08)`;
      setNear(zoneAt(e.clientX, e.clientY));
    },
    onPointerUp(e: React.PointerEvent<HTMLElement>) {
      const s = st.current;
      if (!s) return;
      const zone = zoneAt(e.clientX, e.clientY);
      setNear(null);
      st.current = null;
      s.el.classList.remove('dragging');
      const from = s.el.style.transform;
      s.el.style.transform = '';
      const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10;
      if (zone && moved) {
        emit({ type: 'OBJECT_DROPPED', hit: true });
        onDrop(Number(zone.dataset.dropZone));
      } else if (moved) {
        emit({ type: 'OBJECT_DROPPED', hit: false });
        if (!motionOff()) s.el.animate([{ transform: from }, { transform: 'none' }], { duration: DUR.step, easing: EASE.spring });
      }
    },
    onPointerCancel() {
      const s = st.current;
      if (!s) return;
      setNear(null);
      s.el.classList.remove('dragging');
      s.el.style.transform = '';
      st.current = null;
    },
  };
}
