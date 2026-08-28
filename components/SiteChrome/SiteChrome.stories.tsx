import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Stack, Text } from '@mantine/core';
import SiteChrome, { siteContainerSize, SiteChromeProps } from './SiteChrome';

const defaultProps: SiteChromeProps = {
  isLoggedIn: false,
  containerSize: siteContainerSize,
  children: (
    <Stack align="center" p="xl">
      <Text>Page content</Text>
    </Stack>
  ),
};

const metadata: Meta = {
  title: 'SiteChrome',
  component: SiteChrome,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<SiteChromeProps> = (args) => <SiteChrome {...args} />;

export const Default: StoryFn<SiteChromeProps> = Template.bind({});

export const Wide: StoryFn<SiteChromeProps> = Template.bind({});
Wide.args = { containerSize: 'xl' };
