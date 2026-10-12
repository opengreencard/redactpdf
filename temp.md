# Title: Add adaptive dark-mode favicon

## Motivation

Make the RedactPDF favicon visible and recognizable in both light and dark
browser chrome.

The generated PNG favicon was initially blank because Satori did not render the
memoized `BrandMarkIcon`. The favicon also needed a theme-aware treatment and
slightly more space between the green `R` tile and the `P`.

## Changes

- Remove the `React.memo` wrapper from the shared mark so the generated PNG
  fallback contains visible artwork.
- Add an SVG favicon with embedded `prefers-color-scheme` styling:
  - Keep the transparent canvas and green `R` tile.
  - Use a dark `P` in light mode and a light `P` in dark mode.
- Keep the generated PNG as a fallback for browsers with incomplete SVG favicon
  support.
- Increase the favicon-size gap between the `R` tile and `P` by one pixel.

## Testing

- `yarn build`
- `yarn eslint --fix app/icon.tsx lib/config/BrandMarkIcon.tsx`
- Verify `localhost:3000` emits both the PNG and SVG favicon links.
- Verify the SVG changes the `P` color under light and dark
  `prefers-color-scheme` emulation.
- Inspect enlarged SVG and PNG renders on a checkerboard background:
![Favicon spacing comparison](/var/folders/kn/3104tbs56d7dnlq1kn0ky74m0000gn/T/cursor/screenshots/favicon-spacing-comparison.png)

Generated from this conversation, but edited
