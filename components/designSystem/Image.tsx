import React, { PropsWithChildren } from 'react';
// Disable reminder to use designSystem/Image.tsx (this file)
// eslint-disable-next-line no-restricted-imports
import NextImage, { ImageProps as NextImageProps } from 'next/image';
import {
  // Disable reminder to use designSystem/Image.tsx (this file)
  // eslint-disable-next-line no-restricted-imports
  Image as MantineImage,
  ImageProps as MantineImageProps,
} from '@mantine/core';

export interface ImageProps
  extends MantineImageProps, Pick<NextImageProps, 'alt' | 'fill'> {
  alt: string;
}

/**
 * An image that uses both Mantine and Next.js's image components to apply
 * styles and optimize rendering
 */
const Image: React.FunctionComponent<ImageProps> = React.memo(function Image(
  props: PropsWithChildren<ImageProps>
) {
  return <MantineImage component={NextImage} {...props} />;
});

export default Image;
