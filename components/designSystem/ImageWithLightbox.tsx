'use client';

import React, { useState } from 'react';
import { Lightbox, type LightboxSlideData } from '@mantine/lightbox';
import { useSetState } from '../../lib/hookUtilities/useSetState';
import ButtonDiv from './ButtonDiv';
import Image from './Image';
import classes from './ImageWithLightbox.module.css';

export interface ImageWithLightboxProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Caption under the fullscreen slide, or null when the slide has none. */
  caption: string | null;
  /** Test ID on the thumbnail, or null when this still is not queried. */
  imageTestId: string | null;
}

/**
 * Thumbnail that opens its own Mantine lightbox.
 *
 * Click or keyboard-activate the image to view it fullscreen. The lightbox
 * owns zoom and close; we only keep `opened` here.
 *
 * @see https://mantine.dev/x/lightbox/
 */
const ImageWithLightbox: React.FunctionComponent<ImageWithLightboxProps> =
  React.memo(function ImageWithLightbox(props) {
    const { src, alt, width, height, caption, imageTestId } = props;
    const [opened, setOpened] = useState(false);
    const openLightbox = useSetState(setOpened, true);
    const closeLightbox = useSetState(setOpened, false);

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
            src={src}
            alt={alt}
            width={width}
            height={height}
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
            data-testid={imageTestId ?? undefined}
          />
        </ButtonDiv>
        <Lightbox
          opened={opened}
          onClose={closeLightbox}
          slides={slides}
          // One still: arrows would only loop back to the same image.
          withNavigation={false}
          withZoom
          closeOnClickOutside
        />
      </>
    );
  });

export default ImageWithLightbox;
