import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { makeFakeHandler } from '../../lib/storybook';
import RedactionPreviewToolbar, {
  RedactionPreviewToolbarProps,
} from './RedactionPreviewToolbar';

const defaultProps: RedactionPreviewToolbarProps = {
  pageCount: 3,
  page: 1,
  onPageChange: makeFakeHandler('onPageChange'),
  zoomPercent: 100,
  onZoomChange: makeFakeHandler('onZoomChange'),
  isRedacting: false,
  onIsRedactingChange: makeFakeHandler('onIsRedactingChange'),
};

const metadata: Meta = {
  title: 'RedactionPreviewToolbar',
  component: RedactionPreviewToolbar,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<RedactionPreviewToolbarProps> = (args) => (
  <RedactionPreviewToolbar {...args} />
);

export const Default: StoryFn<RedactionPreviewToolbarProps> = Template.bind({});

export const MiddlePage: StoryFn<RedactionPreviewToolbarProps> = Template.bind(
  {}
);
MiddlePage.args = { page: 2 };

export const LastPage: StoryFn<RedactionPreviewToolbarProps> = Template.bind(
  {}
);
LastPage.args = { page: 3 };

export const DrawModeOn: StoryFn<RedactionPreviewToolbarProps> = Template.bind(
  {}
);
DrawModeOn.args = { isRedacting: true };
