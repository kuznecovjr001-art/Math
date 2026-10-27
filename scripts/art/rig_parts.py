"""
Детали Счётика из листов art-src/schetik → src/motion/rig/parts.json (векторные контуры для рига).

  python -I scripts/art/rig_parts.py art-src/schetik src/motion/rig/parts.json

Каждая деталь вырезается из листа по связной области (ищем по левому верхнему углу, см. PARTS),
обводится vtracer (MIT) и хранится в своих координатах: (0, 0) — левый верхний угол вырезки.
У открытых глаз зрачок и блик убираются из рисунка и записываются числами: риг рисует их сам и двигает взгляд.
"""
import json
import re
import sys
import tempfile
from pathlib import Path

import numpy as np
import vtracer
from PIL import Image
from scipy import ndimage

INK = (61, 44, 0)
EYE_WHITE = (255, 247, 230)
PAD = 4

# лист → {деталь: (x, y) левого верхнего угла области на листе}. L/R — со стороны зрителя.
PARTS = {
    'schetik-parts-head.png': {'head': (154, 190)},
    'schetik-parts-face.png': {
        'eye-open-L': (67, 70), 'eye-open-R': (314, 70), 'eye-half-L': (561, 70), 'eye-half-R': (808, 70),
        'eye-closed-L': (1055, 134), 'eye-closed-R': (1302, 134),
        'brow-calm-L': (102, 370), 'brow-calm-R': (350, 370), 'brow-happy-L': (596, 347), 'brow-happy-R': (844, 347),
        'brow-think-L': (1090, 350), 'brow-think-R': (1338, 396),
        'mouth-smile': (60, 612), 'mouth-wide': (307, 592), 'mouth-a': (581, 557), 'mouth-o': (828, 575),
        'mouth-u': (1103, 582), 'mouth-m': (1315, 628), 'blush-L': (525, 825), 'blush-R': (930, 825),
    },
    'schetik-parts-body.png': {
        'torso': (85, 212), 'leg-L': (802, 624), 'leg-R': (1168, 623),
    },
    # Руки с кистями (arm-*, лист hands) в риг не идут: у черепашки ласты, их риг рисует сам (RigSvg, Flipper).
    'schetik-parts-props.png': {'scarf': (85, 160), 'scarf-wind': (85, 610), 'bag': (990, 175)},
}
# Сумку берём без ремня: ремень риг рисует сам по диагонали через грудь.
CROP = {'bag': (980, 612, 1262, 810)}


def trace(img: Image.Image) -> str:
    with tempfile.TemporaryDirectory() as d:
        src, out = Path(d) / 'p.png', Path(d) / 'p.svg'
        img.save(src)
        vtracer.convert_image_to_svg_py(
            str(src), str(out), colormode='color', hierarchical='stacked', mode='spline', filter_speckle=8,
            color_precision=6, layer_difference=24, corner_threshold=60, length_threshold=4,
            splice_threshold=45, path_precision=1)
        svg = out.read_text()
    return ''.join(re.findall(r'<path[^>]*/>', svg))


def eye_without_pupil(rgba: np.ndarray, mask: np.ndarray):
    """Зрачок и блик закрашиваем белком; возвращаем их размеры, чтобы риг нарисовал их подвижными."""
    dist = ndimage.distance_transform_edt(mask)
    ring = 10  # толщина обводки на листе ~8 px с запасом
    rgb = rgba[:, :, :3]
    ink = np.all(rgb == INK, axis=2)
    shine = np.all(rgb == (255, 255, 255), axis=2)
    # Обводка тонкая, зрачок толстый: «открытие» кругом оставляет только зрачок.
    yy, xx = np.mgrid[-14:15, -14:15]
    core, n = ndimage.label(ndimage.binary_opening(ink, structure=xx ** 2 + yy ** 2 <= 14 ** 2))
    core = core == 1 + np.argmax(ndimage.sum(core > 0, core, range(1, n + 1)))
    near = ndimage.binary_dilation(core, iterations=3)
    lit, n = ndimage.label(shine & ndimage.binary_dilation(core, iterations=20))
    lit = lit == 1 + np.argmax(ndimage.sum(lit > 0, lit, range(1, n + 1)))
    pupil = (near | lit) & (dist > ring)
    ys, xs = np.nonzero(core)
    hy, hx = np.nonzero(lit)
    out = rgba.copy()
    out[pupil] = (*EYE_WHITE, 255)
    my, mx = np.nonzero(mask)
    params = {
        'pupil': [round((xs.min() + xs.max()) / 2, 1), round((ys.min() + ys.max()) / 2, 1),
                  round((xs.max() - xs.min()) / 2 + ring / 2, 1), round((ys.max() - ys.min()) / 2 + ring / 2, 1)],
        'shine': [round(hx.mean(), 1), round(hy.mean(), 1), round(max(np.ptp(hx), np.ptp(hy)) / 2 + 1, 1)],
        # Белок без обводки — по нему обрезается зрачок, когда смотрит в сторону.
        'clip': [round((mx.min() + mx.max()) / 2, 1), round((my.min() + my.max()) / 2, 1),
                 round((mx.max() - mx.min()) / 2 - ring / 2, 1), round((my.max() - my.min()) / 2 - ring / 2, 1)],
    }
    return out, params


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    parts = {}
    for sheet, want in PARTS.items():
        rgba = np.array(Image.open(src / sheet).convert('RGBA'))
        lab, _ = ndimage.label(rgba[:, :, 3] > 0, structure=np.ones((3, 3)))
        boxes = ndimage.find_objects(lab)
        for name, (x, y) in want.items():
            i = next(i for i, s in enumerate(boxes) if s and abs(s[1].start - x) <= 2 and abs(s[0].start - y) <= 2)
            s = boxes[i]
            x0, y0, x1, y1 = CROP.get(name, (s[1].start - PAD, s[0].start - PAD, s[1].stop + PAD, s[0].stop + PAD))
            mask = lab[y0:y1, x0:x1] == i + 1
            part = rgba[y0:y1, x0:x1].copy()
            part[~mask] = 0
            extra = {}
            if name.startswith('eye-open'):
                part, extra = eye_without_pupil(part, mask)
            parts[name] = {'w': x1 - x0, 'h': y1 - y0, 'svg': trace(Image.fromarray(part)), **extra}
            print(f"{name:14s} {x1 - x0}x{y1 - y0} {len(parts[name]['svg']) // 1024} KB")
    dst.write_text(json.dumps(parts, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{dst}: {dst.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
