/**
 * Shared global styles for the app shell and Storybook.
 * Import from `app/layout.tsx` and `.storybook/preview.tsx`.
 */
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';

// Import the CSS ourselves so Next/Storybook can place it; disable Font
// Awesome's runtime injection or icons get a flash of unstyled SVG.
config.autoAddCss = false;
