import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import RedactionPageInner, {
  RedactionPageInnerProps,
} from './RedactionPageInner';

const defaultProps: RedactionPageInnerProps = {
  redactionKey: 'storybook-key',
};

const metadata: Meta = {
  title: 'RedactionPageInner',
  component: RedactionPageInner,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<RedactionPageInnerProps> = (args) => (
  <RedactionPageInner {...args} />
);

export const Default: StoryFn<RedactionPageInnerProps> = Template.bind({});
