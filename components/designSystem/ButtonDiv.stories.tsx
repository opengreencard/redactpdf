import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Text } from '@mantine/core';
import { makeFakeHandler } from '../../lib/storybook';
import ButtonDiv, { ButtonDivProps } from './ButtonDiv';

const defaultProps: ButtonDivProps = {
  className: 'storybook-button-div',
  onClick: makeFakeHandler('onClick'),
  children: <Text>Clickable row</Text>,
};

const metadata: Meta = {
  title: 'ButtonDiv',
  component: ButtonDiv,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<ButtonDivProps> = (args) => <ButtonDiv {...args} />;

export const Default: StoryFn<ButtonDivProps> = Template.bind({});
