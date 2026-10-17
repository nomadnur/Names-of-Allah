"""Build the app icon: 'الله' in Scheherazade New Bold as vector paths (no font needed to view)."""
import sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONT = "font/ScheherazadeNew-Bold.ttf"
TEXT = "اللَّٰه"   # alef, lam, lam + shadda + dagger alef, ha

blob = hb.Blob.from_file_path(FONT)
face = hb.Face(blob); font = hb.Font(face)
buf = hb.Buffer(); buf.add_str(TEXT); buf.guess_segment_properties()
hb.shape(font, buf, {})
tt = TTFont(FONT); gs = tt.getGlyphSet(); order = tt.getGlyphOrder()

# Lay glyphs out (harfbuzz gives visual order for RTL), font units, y up
items = []; x = 0
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    items.append((order[info.codepoint], x + pos.x_offset, pos.y_offset)); x += pos.x_advance

bp = BoundsPen(gs)
for name, dx, dy in items:
    gs[name].draw(TransformPen(bp, (1, 0, 0, 1, dx, dy)))
xmin, ymin, xmax, ymax = bp.bounds

def paths(box, cx, cy):
    """Scale text to fit a box (px) centred on (cx, cy), flip y for SVG."""
    w, h = xmax - xmin, ymax - ymin
    s = min(box / w, box / h)
    ox = cx - (xmin + w / 2) * s
    oy = cy + (ymin + h / 2) * s
    pen = SVGPathPen(gs)
    for name, dx, dy in items:
        gs[name].draw(TransformPen(pen, (s, 0, 0, -s, ox + dx * s, oy - dy * s)))
    return pen.getCommands()

BG, GOLD, INK = "#2A5F5C", "#C9A961", "#FDFCF9"

def svg(maskable=False, rounded=True):
    # Maskable icons get cropped to a circle/squircle: keep art inside the central 80%
    ring_r, ring_w, text_box = (176, 7, 210) if maskable else (206, 8, 250)
    rect = '<rect width="512" height="512" rx="112" fill="%s"/>' % BG if rounded and not maskable else \
           '<rect width="512" height="512" fill="%s"/>' % BG
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <title>Names of Allah</title>
  {rect}
  <circle cx="256" cy="256" r="{ring_r}" fill="none" stroke="{GOLD}" stroke-width="{ring_w}"/>
  <circle cx="256" cy="256" r="{ring_r - 16}" fill="none" stroke="{GOLD}" stroke-opacity="0.45" stroke-width="2"/>
  <path fill="{INK}" d="{paths(text_box, 256, 262)}"/>
</svg>
'''

open("icon.svg", "w").write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <title>Names of Allah</title>
  <rect width="512" height="512" rx="112" fill="{BG}"/>
  <path fill="{INK}" d="{paths(380, 256, 262)}"/>
</svg>
''')  # browser tab: rounded, no rings, larger word so it reads at 16-32 px
open("icon-square.svg", "w").write(svg(rounded=False))  # home-screen PNGs: the OS rounds them
open("icon-maskable.svg", "w").write(svg(maskable=True))
print("glyphs:", [n for n, _, _ in items], "bounds:", (xmin, ymin, xmax, ymax))
