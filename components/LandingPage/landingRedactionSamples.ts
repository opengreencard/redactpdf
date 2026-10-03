import type { BeforeAfterRedactionCardProps } from './BeforeAfterRedactionCard';

interface LandingRedactionSample extends Pick<
  BeforeAfterRedactionCardProps,
  'beforeSrc' | 'afterSrc' | 'beforeAlt' | 'afterAlt' | 'title'
> {
  width: number;
  height: number;
}

/**
 * Dutch passport stills for the landing before/after card.
 *
 * Keep in sync with `generateLandingRedactionSamples`: rerun
 * `yarn swc-node scripts/generateLandingRedactionSamples.ts` and copy the
 * printed width/height here. Last updated 2026-10-03.
 */
export const dutchPassportSample: LandingRedactionSample = {
  title: 'Dutch passport',
  beforeSrc: '/samples/dutch-passport-before.jpg',
  afterSrc: '/samples/dutch-passport-after.jpg',
  beforeAlt: 'Dutch passport specimen before redaction',
  afterAlt:
    'Dutch passport specimen after names, dates, and photos are blacked out',
  width: 1920,
  height: 2778,
};

/**
 * Cropped 1040 identity header for the landing before/after card.
 *
 * Keep in sync with `generateLandingRedactionSamples` (same as
 * `dutchPassportSample`). Last updated 2026-10-03.
 */
export const irs1040Sample: LandingRedactionSample = {
  title: 'IRS Form 1040',
  beforeSrc: '/samples/irs1040-before.jpg',
  afterSrc: '/samples/irs1040-after.jpg',
  beforeAlt: 'IRS Form 1040 identity header before redaction',
  afterAlt:
    'IRS Form 1040 identity header after names, SSNs, and the address are blacked out',
  width: 1224,
  height: 314,
};
