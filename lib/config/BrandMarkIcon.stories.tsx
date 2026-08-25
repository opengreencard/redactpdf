import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { BrandMarkIcon, BrandMarkIconProps } from './BrandMarkIcon';

const metadata: Meta = {
  title: 'BrandMarkIcon',
  component: BrandMarkIcon,
};
export default metadata;

const Template: StoryFn<BrandMarkIconProps> = (args) => (
  // Checkerboard backdrop makes transparent canvas pixels visible in Storybook;
  // production icons are transparent PNGs from ImageResponse.
  <div
    style={{
      display: 'inline-flex',
      background:
        'repeating-conic-gradient(#e9ecef 0% 25%, #fff 0% 50%) 50% / 16px 16px',
      padding: 16,
    }}
  >
    <BrandMarkIcon {...args} />
  </div>
);

/** Matches `app/icon.tsx` (32×32 tab favicon). */
export const Favicon: StoryFn<BrandMarkIconProps> = Template.bind({});
Favicon.args = { size: 32 };

/** Matches `app/apple-icon.tsx` (180×180 apple-touch tile). */
export const AppleTouch: StoryFn<BrandMarkIconProps> = Template.bind({});
AppleTouch.args = { size: 180 };
