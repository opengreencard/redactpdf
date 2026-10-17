import '../components/TopLevelLayout/topLevelLayoutStyles';
import React from 'react';
import type { Decorator, StoryFn } from '@storybook/react';
import { fontClassNames } from '../lib/config/fonts';
import TopLevelLayoutComponents from '../components/TopLevelLayout/TopLevelLayoutComponents';

// Apply the same font classes as app/layout.tsx. Keep in sync. They go on
// <html> because Mantine resolves `--mantine-font-family` on `:root`.
document.documentElement.classList.add(...fontClassNames.split(' '));

export const decorators: Decorator[] = [
  (Story: StoryFn) => (
    <TopLevelLayoutComponents>
      <Story />
    </TopLevelLayoutComponents>
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
