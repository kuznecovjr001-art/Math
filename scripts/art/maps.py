"""
Карты островов, детали их анимации и ладошки для счёта: art-src → src/assets/art + src/content/mapLife.json.

  python -I scripts/art/maps.py art-src

  art-src/map/clean/map-<остров>-<land|port>.png   чистые карты (без облаков и бликов, вода #2A9D8F)
  art-src/map/anim/…                                те же карты без мельничного ротора, ткани флажков и лодки
  art-src/map/parts/*.png + parts-layout.json       ротор, флажки, лодка на холстах 1024
  art-src/hand/hand-<left|right>-<0…5>.png          ладошки, число — поднятые пальцы

Печатает уточнённые центры площадок (старые координаты из mapLayout.ts, притянутые к самому широкому
месту песка рядом) — их переносим в mapLayout.ts. Пишет mapLife.json: где на воде блестят блики
и где на подложке стоят детали.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ISLANDS = ['count', 'compose', 'ten', 'groups', 'table', 'hundreds']
WATER = np.array((42, 157, 143))
OUT_BG = Path('src/assets/art/bg')
OUT_LIFE = Path('src/assets/art/maplife')
OUT_HAND = Path('src/assets/art/hand')


def bg_name(isl: str, o: str) -> str:
    # Остров счёта исторически лежит как bg/map-land (art.ts: bgVars('map')).
    return f'map-{o}' if isl == 'count' else f'map-{isl}-{o}'


def pct(v: float, total: int) -> float:
    return round(v / total * 100, 1)


def sparkles(rgb: np.ndarray, n: int = 9) -> list[list[float]]:
    """Точки на открытой воде подальше от берега и краёв, разнесённые друг от друга (одинаково при каждом запуске)."""
    h, w, _ = rgb.shape
    water = np.abs(rgb.astype(int) - WATER).sum(2) <= 9
    water[:, :1] = water[:, -1:] = water[:1] = water[-1:] = False  # край кадра считаем берегом
    ys, xs = np.nonzero(ndimage.distance_transform_edt(water) > min(h, w) * 0.04)
    order = np.random.default_rng(7).permutation(len(xs))
    chosen: list[tuple[int, int]] = []
    for i in order:
        x, y = int(xs[i]), int(ys[i])
        if all(np.hypot(x - cx, y - cy) > max(h, w) * 0.16 for cx, cy in chosen):
            chosen.append((x, y))
            if len(chosen) == n:
                break
    return [[pct(x, w), pct(y, h)] for x, y in chosen]


def snap_stops(rgb: np.ndarray, pts: list[tuple[float, float]]) -> list[tuple[int, int]]:
    """Находим центры площадок (самые широкие места песка) и каждой старой точке отдаём ближайшую свою площадку."""
    from scipy.optimize import linear_sum_assignment
    h, w, _ = rgb.shape
    r, g, b = (rgb[:, :, i].astype(int) for i in range(3))
    sand = (r >= 240) & (g >= 195) & (g <= 240) & (b >= 100) & (b <= 185)
    edt = ndimage.distance_transform_edt(ndimage.binary_opening(sand, iterations=2))
    peak = (edt == ndimage.maximum_filter(edt, size=int(w * 0.06))) & (edt > w * 0.022)
    lab, n = ndimage.label(peak)
    cand = np.array(ndimage.center_of_mass(peak, lab, range(1, n + 1))).reshape(-1, 2)[:, ::-1]  # (x, y)
    old = np.array([(px / 100 * w, py / 100 * h) for px, py in pts])
    if len(cand) == 0:
        return [(round(px), round(py)) for px, py in pts]
    cost = np.hypot(*(old[:, None, :] - cand[None, :, :]).transpose(2, 0, 1))
    rows, cols = linear_sum_assignment(cost)
    out = [(round(px), round(py)) for px, py in pts]
    for i, j in zip(rows, cols):
        if cost[i, j] <= w * 0.12:
            out[i] = (round(cand[j][0] / w * 100), round(cand[j][1] / h * 100))
    return out


def removed_box(clean: np.ndarray, anim: np.ndarray, near: tuple[int, int, int, int]) -> list[float]:
    """Рамка того, что убрали с подложки, в пределах области near (x0, y0, x1, y1), в процентах."""
    h, w, _ = clean.shape
    m = np.abs(clean.astype(int) - anim.astype(int)).sum(2) > 30
    x0, y0, x1, y1 = near
    ys, xs = np.nonzero(m[y0:y1, x0:x1])
    bx0, by0, bx1, by1 = xs.min() + x0, ys.min() + y0, xs.max() + x0 + 1, ys.max() + y0 + 1
    return [pct(bx0, w), pct(by0, h), pct(bx1 - bx0, w), pct(by1 - by0, h)]


def main():
    src = Path(sys.argv[1])
    OUT_LIFE.mkdir(parents=True, exist_ok=True)
    OUT_HAND.mkdir(parents=True, exist_ok=True)
    layout = Path('src/content/mapLayout.ts').read_text(encoding='utf-8')
    life: dict = {}

    # Детали анимации: где их убрали с подложки (ищем рядом с примерным местом на карте).
    PARTS = {
        ('hundreds', 'land'): {'rotor': (1230, 290, 1536, 660), 'flag-lilac': (740, 0, 900, 90), 'boat': (950, 790, 1130, 940)},
        ('table', 'land'): {'flag-green': (940, 0, 1030, 60)},
        ('table', 'port'): {'flag-green': (540, 0, 620, 60), 'boat': (620, 1320, 800, 1450)},
    }

    for isl in ISLANDS:
        for o in ('land', 'port'):
            clean_p = src / 'map/clean' / f'map-{isl}-{o}.png'
            anim_p = src / 'map/anim' / f'map-{isl}-{o}.png'
            clean = np.array(Image.open(clean_p).convert('RGB'))
            base = Image.open(anim_p if anim_p.exists() else clean_p).convert('RGB')
            base.save(OUT_BG / f'{bg_name(isl, o)}.webp', quality=82, method=6)
            entry = {'sparkles': sparkles(clean)}
            if (isl, o) in PARTS:
                anim = np.array(base)
                entry['parts'] = {k: removed_box(clean, anim, near) for k, near in PARTS[(isl, o)].items()}
            life.setdefault(isl, {})[o] = entry

            m = re.search(isl + r': \[(.*?)\n  \]', layout, re.S)
            if isl != 'hundreds' and m:
                key = 'land' if o == 'land' else 'port'
                old = re.findall(key + r': \[(\d+), (\d+)\]', m.group(1))
                print(isl, o, snap_stops(clean, [(float(a), float(b)) for a, b in old]))

    Path('src/content/mapLife.json').write_text(json.dumps(life, separators=(',', ':')) + '\n', encoding='utf-8')

    lay = json.loads((src / 'map/parts/parts-layout.json').read_text(encoding='utf-8'))
    names = {'windmill-rotor.png': 'rotor', 'flag-clock-lilac.png': 'flag-lilac', 'flag-lighthouse-green.png': 'flag-green', 'wooden-boat.png': 'boat'}
    for p in lay:
        im = Image.open(src / 'map/parts' / p['file']).convert('RGBA').crop(tuple(p['single_box']))
        im.thumbnail((360, 360))
        im.save(OUT_LIFE / f"{names[p['file']]}.webp", quality=88, method=6)

    # Ладошки: общая рамка для всех 12, чтобы масштаб и запястье совпадали; кончики поднятых пальцев — для подписей.
    hands = sorted((src / 'hand').glob('hand-*.png'))
    boxes = [Image.open(f).getchannel('A').getbbox() for f in hands]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    tips = {}
    for f in hands:
        im = Image.open(f).convert('RGBA').crop(box)
        a = np.array(im)[:, :, 3] > 0
        top = np.where(a.any(0), a.argmax(0), a.shape[0])
        up = int(f.stem[-1])
        # Кончики: локальные минимумы верхнего края (сглаженного), up самых высоких.
        prof = ndimage.uniform_filter1d(top.astype(float), size=9)
        win = int(a.shape[1] * 0.09)
        lows = np.nonzero((prof == ndimage.minimum_filter1d(prof, size=win)) & (top < a.shape[0]))[0]
        runs = np.split(lows, np.nonzero(np.diff(lows) > 1)[0] + 1) if len(lows) else []
        found = sorted((int(rr.mean()) for rr in runs), key=lambda x: prof[x])[:up]
        tips[f.stem] = sorted([[pct(x, a.shape[1]), pct(top[x], a.shape[0])] for x in found])
        out = im.resize((320, round(320 * im.height / im.width)), Image.LANCZOS)
        out.save(OUT_HAND / f'{f.stem}.webp', quality=88, method=6)
    Path('src/content/handTips.json').write_text(json.dumps(tips, separators=(',', ':')) + '\n', encoding='utf-8')
    print('hand box', box)


if __name__ == '__main__':
    main()
