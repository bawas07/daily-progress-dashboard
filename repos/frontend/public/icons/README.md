# PWA Icons

This directory contains the PWA app icons for the Daily Progress application.

## Current Icons

- `icon-192.png` - 192x192 PNG icon (10KB)
- `icon-512.png` - 512x512 PNG icon (20KB)
- `icon.svg` - Source SVG file
- `icon-192.svg` - SVG scaled to 192x192
- `icon-512.svg` - SVG scaled to 512x512

## Icon Generation

The icons were generated using **ImageMagick** from the source SVG file:

```bash
# Generate PNG icons
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png

# Generate favicon with multiple sizes
convert icon.svg -resize 64x64 -define icon:auto-resize=64,48,32,16 ../favicon.ico
```

### Requirements

- ImageMagick (`convert` command)
- Source SVG file (`icon.svg`)

## Icon Design

- **Background color**: #3b82f6 (blue - matches theme)
- **Text**: "DP" in white
- **Style**: Simple, clean, professional

## PWA Configuration

The icons are referenced in `/repos/frontend/vite.config.ts`:

```javascript
icons: [
  {
    src: '/icons/icon-192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'any maskable'
  },
  {
    src: '/icons/icon-512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any maskable'
  }
]
```

## Regenerating Icons

If you need to regenerate the icons (e.g., after changing the design):

1. Edit `icon.svg` with your desired design
2. Install ImageMagick: `sudo apt-get install imagemagick` (Linux) or `brew install imagemagick` (macOS)
3. Run the conversion commands shown above
4. Rebuild the frontend: `npm run build`

## Verification

To verify the icons work correctly:

1. Start the frontend dev server: `cd /repos/frontend && npm run dev`
2. Open http://localhost:3000 in a browser
3. Open Chrome DevTools → Application → Manifest
4. Check that icons appear correctly in the PWA install prompt
