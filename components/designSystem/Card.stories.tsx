import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Text } from '@mantine/core';
import Card, { CardProps } from './Card';

const defaultProps: CardProps = {};

const metadata: Meta = {
  title: 'Card',
  component: Card,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<CardProps> = (args) => (
  <Card {...args}>
    <Text>Flat card content</Text>
  </Card>
);

export const Default: StoryFn<CardProps> = Template.bind({});
