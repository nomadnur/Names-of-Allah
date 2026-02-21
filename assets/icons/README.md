# PWA Icons

## Current Status

Currently using a **placeholder SVG icon** (`icon.svg`) with:
- Deep teal background (#2D5F4F)
- "99" text in white
- "Names" subtitle in gold

## Required Sizes

For full PWA support, generate PNG icons from the SVG:

```bash
# Using ImageMagick (if installed)
convert -background none icon.svg -resize 192x192 icon-192.png
convert -background none icon.svg -resize 512x512 icon-512.png

# Or use online tools:
# https://realfavicongenerator.net/
# https://www.favicon-generator.org/
```

## Design Recommendations

For a more polished icon, consider:

1. **Islamic Geometric Pattern**: Star/circle motif (8-point star common in Islamic art)
2. **Calligraphy**: Stylized Arabic text (Allah's name or "99")
3. **Color Palette**: Stick to brand colors (teal + gold)
4. **Simplicity**: Should be recognizable at 48x48px

## Tools

- Figma/Canva (design)
- [Realfavicongenerator](https://realfavicongenerator.net/) (generate all sizes)
- [App Icon Generator](https://appicon.co/) (iOS/Android)

## TODO

- [ ] Design final icon (Islamic geometric pattern or calligraphy)
- [ ] Generate 192x192 PNG (required)
- [ ] Generate 512x512 PNG (required)
- [ ] Generate 32x32 favicon.ico (optional)
- [ ] Test maskable icon support (Android adaptive icons)
