import type { BoxProps } from '@mantine/core';

/**
 * Gutter and top margin for the centered status cards. The side padding keeps
 * them off the screen edges on phones.
 */
export const centeredStatusWrapperProps: BoxProps = { px: 'md', mt: 'xl' };

/**
 * Keeps centered status messages readable without making them feel cramped.
 * 32rem is 512px, which fits comfortably in the page while allowing
 * paragraphs and progress text to remain easy to scan.
 */
export const centeredAlertOrCardMaxWidth = '32rem';

/**
 * Outline on enabled redaction boxes. The landing hero imports this value so
 * its mock matches the review overlay. Only the selected fill colour is
 * duplicated, in LandingPageHeroIllustration.module.css.
 */
export const redactionOverlayBorder = '2px solid var(--mantine-color-red-6)';
