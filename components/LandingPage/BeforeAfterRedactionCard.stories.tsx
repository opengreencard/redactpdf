import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import BeforeAfterRedactionCard, {
  BeforeAfterSide,
  BeforeAfterRedactionCardProps,
} from './BeforeAfterRedactionCard';
import { dutchPassportSample, irs1040Sample } from './landingRedactionSamples';

const defaultProps: BeforeAfterRedactionCardProps = dutchPassportSample;

const metadata: Meta = {
  title: 'BeforeAfterRedactionCard',
  component: BeforeAfterRedactionCard,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<BeforeAfterRedactionCardProps> = (args) => (
  <BeforeAfterRedactionCard {...args} />
);

export const Default: StoryFn<BeforeAfterRedactionCardProps> = Template.bind(
  {}
);

export const IRS1040: StoryFn<BeforeAfterRedactionCardProps> = Template.bind(
  {}
);
IRS1040.args = irs1040Sample;

export const FrozenAfter: StoryFn<BeforeAfterRedactionCardProps> =
  Template.bind({});
FrozenAfter.args = {
  ...dutchPassportSample,
  initialFrozenSideForTesting: BeforeAfterSide.after,
};
