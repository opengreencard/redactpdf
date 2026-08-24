import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import TermsOfUsePage from './TermsOfUsePage';

const metadata: Meta = {
  title: 'TermsOfUsePage',
  component: TermsOfUsePage,
};
export default metadata;

const Template: StoryFn = () => <TermsOfUsePage />;

export const Default: StoryFn = Template.bind({});
