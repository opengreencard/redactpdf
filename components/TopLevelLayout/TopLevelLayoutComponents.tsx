'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '../../theme';

export interface TopLevelLayoutComponentsProps {
  children: React.ReactNode;
}

/**
 * Providers shared by `app/layout.tsx` and `.storybook/preview.tsx`.
 * Keep those two files importing this component instead of mounting
 * Mantine and Notifications separately.
 */
const TopLevelLayoutComponents: React.FunctionComponent<TopLevelLayoutComponentsProps> =
  React.memo(function TopLevelLayoutComponents(
    props: TopLevelLayoutComponentsProps
  ) {
    const { children } = props;

    return (
      <MantineProvider theme={theme}>
        <Notifications />
        {children}
      </MantineProvider>
    );
  });

export default TopLevelLayoutComponents;
