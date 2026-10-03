import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Text } from '@mantine/core';
import Fade, { FadeProps } from './Fade';

const defaultProps: FadeProps = {
  visible: true,
  children: <Text>Visible faded content</Text>,
};

const metadata: Meta = {
  title: 'Fade',
  component: Fade,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<FadeProps> = (args) => <Fade {...args} />;

export const Default: StoryFn<FadeProps> = Template.bind({});

export const Hidden: StoryFn<FadeProps> = Template.bind({});
Hidden.args = { visible: false };
