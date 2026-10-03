'use client';

import React, { useState } from 'react';
import {
  Lightbox,
  type LightboxProps,
  type LightboxSlideData,
} from '@mantine/lightbox';
import { useSetState } from '../../lib/hookUtilities/useSetState';
import type { RequiredWithUndefined } from '../../lib/typescript/requiredWithUndefined';
import ButtonDiv from './ButtonDiv';
import Image, { type ImageProps } from './Image';
import classes from './ImageWithLightbox.module.css';

interface ImageWithLightboxOwnProps extends Pick<
  LightboxProps,
  'withZoom' | 'withNavigation' | 'closeOnClickOutside'
> {
  /** Caption under the fullscreen slide, or null when the slide has none. */
  caption: string | null;
}

interface ImageWithLightboxPassThroughProps extends Omit<
  ImageProps,
  'onClick'
> {}

export interface ImageWithLightboxProps
  extends ImageWithLightboxOwnProps, ImageWithLightboxPassThroughProps {}

/**
 * Thumbnail that opens its own Mantine lightbox.
 *
 * Click or keyboard-activate the image to view it fullscreen. The lightbox
 * owns zoom and close; we only keep `opened` here. Image sizing and most
 * Mantine Image props pass through.
 *
 * @see https://mantine.dev/x/lightbox/
 */
const ImageWithLightbox: React.FunctionComponent<ImageWithLightboxProps> =
  React.memo(function ImageWithLightbox(props) {
    const {
      caption,
      withZoom = true,
      withNavigation = false,
      closeOnClickOutside = true,
      ...passThroughProps
    } = props;
    // Keep owned lightbox fields out of the Image spread.
    const _ownProps: RequiredWithUndefined<ImageWithLightboxOwnProps> = {
      caption,
      withZoom,
      withNavigation,
      closeOnClickOutside,
    };

    const [opened, setOpened] = useState(false);
    const openLightbox = useSetState(setOpened, true);
    const closeLightbox = useSetState(setOpened, false);

    const src =
      typeof passThroughProps.src === 'string' ? passThroughProps.src : '';
    const { alt } = passThroughProps;
    const slide: LightboxSlideData =
      caption === null ? { src, alt } : { src, alt, caption };
    const slides: LightboxSlideData[] = [slide];

    return (
      <>
        <ButtonDiv
          className={classes.imageButton}
          // Block so the thumbnail fills the column. ButtonDiv omits
          // `style`, so we use the Mantine display prop instead of the
          // hover CSS module.
          display="block"
          onClick={openLightbox}
          aria-label={`Open ${caption ?? alt} fullscreen`}
        >
          <Image
            // Defaults first so a caller can override them via pass-through.
            w="100%"
            // Next needs height:auto when CSS changes width, or the still
            // stays at the intrinsic height and mah clips the top.
            // https://nextjs.org/docs/app/api-reference/components/image#to-maintain-aspect-ratio
            h="auto"
            // Cap thumbnail height so cards in a row line up even when
            // the stills have different pixel sizes.
            mah={360}
            fit="contain"
            radius="sm"
            {...passThroughProps}
          />
        </ButtonDiv>
        <Lightbox
          opened={opened}
          onClose={closeLightbox}
          slides={slides}
          withNavigation={withNavigation}
          withZoom={withZoom}
          closeOnClickOutside={closeOnClickOutside}
        />
      </>
    );
  });

export default ImageWithLightbox;
