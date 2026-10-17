interface LandingSpacing {
  /**
   * Top and bottom padding of a section band, including the dark
   * redaction-failures band: phone, then `sm` and up.
   */
  sectionPaddingY: { base: number; sm: number };
  /** Gutter between a section's heading column and its content column. */
  splitColumnGap: number;
  /** Top padding of the hero band. */
  heroPaddingTop: { base: number; sm: number };
  /** Gutter between the two columns of the hero. */
  heroColumnGap: number;
  /**
   * Vertical rhythm between the hero's parts: its bottom padding, and the gap
   * above the hero dropzone.
   */
  blockGap: { base: number; sm: number };
  /** Gap above the closing paragraph of the failures band. */
  closingGap: number;
}

/**
 * Vertical rhythm and grid gutters for the landing page. These are larger than
 * the theme spacing scale (xl is 32px), so each one gets a named role here.
 */
export const landingSpacing: LandingSpacing = {
  sectionPaddingY: { base: 56, sm: 80 },
  splitColumnGap: 72,
  heroPaddingTop: { base: 40, sm: 72 },
  heroColumnGap: 64,
  blockGap: { base: 48, sm: 64 },
  closingGap: 48,
};
