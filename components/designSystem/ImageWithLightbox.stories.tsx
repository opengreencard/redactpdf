import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { dutchPassportSample } from '../LandingPage/landingRedactionSamples';
import ImageWithLightbox, { ImageWithLightboxProps } from './ImageWithLightbox';

const defaultProps: ImageWithLightboxProps = {
  src: dutchPassportSample.beforeSrc,
  alt: dutchPassportSample.beforeAlt,
  width: dutchPassportSample.width,
  height: dutchPassportSample.height,
  caption: 'Before',
  imageTestId: null,
};

const metadata: Meta = {
  title: 'ImageWithLightbox',
  component: ImageWithLightbox,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<ImageWithLightboxProps> = (args) => (
  <ImageWithLightbox {...args} />
);

export const Default: StoryFn<ImageWithLightboxProps> = Template.bind({});
