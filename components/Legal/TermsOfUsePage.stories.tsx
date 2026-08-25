import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import SiteChrome from '../SiteChrome/SiteChrome';
import TermsOfUsePage from './TermsOfUsePage';

const metadata: Meta = {
  title: 'TermsOfUsePage',
  component: TermsOfUsePage,
};
export default metadata;

const Template: StoryFn = () => (
  <SiteChrome isLoggedIn={false}>
    <TermsOfUsePage />
  </SiteChrome>
);

export const Default: StoryFn = Template.bind({});
