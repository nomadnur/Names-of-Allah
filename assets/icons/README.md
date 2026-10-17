# PWA Icons

The word **الله** in Scheherazade New Bold (the app's Arabic font), cream on the app teal
(`#2A5F5C`) inside a gold ring. The letters are vector paths, so the icon looks the same
on devices without the font.

| File | Use |
|------|-----|
| `icon.svg` | Browser tab. Rounded, no rings, larger word so it reads at 16–32 px |
| `icon-192.png`, `icon-512.png` | Home-screen icons. Solid squares: the phone rounds them (iOS turns transparent corners black) |
| `icon-512-maskable.png` | Android adaptive icon. Art kept inside the central 80% so a circle crop does not cut it |

## Rebuild

`scripts/make_icon.py` writes the SVGs. It needs `fonttools` and `uharfbuzz`, and
`font/ScheherazadeNew-Bold.ttf` from https://github.com/google/fonts/tree/main/ofl/scheherazadenew.
Render the PNGs from the SVGs at 512 px (for example with headless Chrome), then resize the
square one to 192 px.
