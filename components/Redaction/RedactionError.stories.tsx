import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import RedactionError, { RedactionErrorProps } from './RedactionError';

const defaultProps: RedactionErrorProps = {
  message: null,
};

const metadata: Meta = {
  title: 'RedactionError',
  component: RedactionError,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<RedactionErrorProps> = (args) => (
  <RedactionError {...args} />
);

export const Default: StoryFn<RedactionErrorProps> = Template.bind({});

export const WithMessage: StoryFn<RedactionErrorProps> = Template.bind({});
WithMessage.args = {
  message: 'The PDF could not be analyzed.',
};
