import '../components/TopLevelLayout/topLevelLayoutStyles';
import React from 'react';
import type { Decorator, StoryFn } from '@storybook/react';
import { outfit } from '../lib/config/fonts';
import TopLevelLayoutComponents from '../components/TopLevelLayout/TopLevelLayoutComponents';

export const decorators: Decorator[] = [
  (Story: StoryFn) => (
    // Apply same font as in layout.tsx. Keep in sync
    <div className={outfit.variable}>
      <TopLevelLayoutComponents>
        <Story />
      </TopLevelLayoutComponents>
    </div>
  ),
];

// We don't want Storybook to add the "sb-main-padded"
// class by default
// https://github.com/storybookjs/storybook/issues/12109#issuecomment-676489119
export const parameters: {
  layout: 'fullscreen';
  nextjs: { appDirectory: true };
} = {
  layout: 'fullscreen',
  nextjs: { appDirectory: true },
};
