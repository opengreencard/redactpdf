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
 * Keep in sync with:
 * - `irs1040Sample` in this file
 * - `generateLandingRedactionSamples`
 *
 * Rerun `yarn swc-node scripts/generateLandingRedactionSamples.ts` and
 * copy the printed width/height and file names here.
 */
export const dutchPassportSample: LandingRedactionSample = {
  title: 'Dutch passport',
  beforeSrc: '/samples/dutch-passport-before.jpg',
  afterSrc: '/samples/dutch-passport-after.jpg',
  beforeAlt: 'Dutch passport specimen before redaction',
  afterAlt:
    'Dutch passport specimen after names, dates, and photos are blacked out',
  width: 885,
  height: 1280,
};

/**
 * IRS 1040 stills cropped to the Dutch passport aspect ratio.
 *
 * Keep in sync with:
 * - `dutchPassportSample` in this file
 * - `generateLandingRedactionSamples`
 *
 * Rerun `yarn swc-node scripts/generateLandingRedactionSamples.ts` and
 * copy the printed width/height and file names here.
 */
export const irs1040Sample: LandingRedactionSample = {
  title: 'IRS Form 1040',
  beforeSrc: '/samples/irs1040-before.jpg',
  afterSrc: '/samples/irs1040-after.jpg',
  beforeAlt: 'IRS Form 1040 before redaction',
  afterAlt: 'IRS Form 1040 after names, SSNs, and the address are blacked out',
  width: 884,
  height: 1280,
};
