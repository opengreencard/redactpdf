'use client';

import React, { useState } from 'react';
import { Box, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { Lightbox, type LightboxSlideData } from '@mantine/lightbox';
import Button from '../designSystem/Button/Button';
import ButtonDiv from '../designSystem/ButtonDiv';
import Card from '../designSystem/Card';
import Fade from '../designSystem/Fade';
import Image, { type ImageProps } from '../designSystem/Image';
import { useInterval } from '../../lib/hookUtilities/useInterval';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useSetState } from '../../lib/hookUtilities/useSetState';
import classes from './BeforeAfterRedactionCard.module.css';

/** Which still the mobile card is showing or freezing. */
export enum BeforeAfterSide {
  before = 'before',
  after = 'after',
}

/** Mobile stack so tests can assert which side is showing. */
export const _mobileSampleImageTestId = 'before-after-mobile-image';
/** After button so tests can freeze the flip. */
export const _freezeAfterButtonTestId = 'before-after-freeze-after';

export interface BeforeAfterRedactionCardProps {
  /**
   * Unredacted sample. Desktop shows it in the left column. Mobile fades
   * it with `afterSrc` until Before or After is frozen.
   */
  beforeSrc: string;
  /**
   * Sample with black boxes burned in. Desktop shows it in the right
   * column. Mobile stacks it on top of `beforeSrc` and fades it in.
   */
  afterSrc: string;
  /** Alt text for the unredacted still and its lightbox slide. */
  beforeAlt: string;
  /** Alt text for the redacted still and its lightbox slide. */
  afterAlt: string;
  /** Heading at the top of the card, e.g. "Dutch passport". */
  title: string;
  /**
   * Intrinsic pixel width of both stills. Next/Image uses this to reserve
   * space; the card then scales the image to the column width.
   */
  width: number;
  /**
   * Intrinsic pixel height of both stills. Same reservation as `width`.
   */
  height: number;
  /**
   * How long the mobile card shows one side before fading to the other,
   * while nobody has frozen Before or After.
   */
  intervalMs?: number;
  /**
   * Storybook / tests only. Start already frozen on this side so we can
   * screenshot After without waiting for the timer.
   */
  initialFrozenSideForTesting?: BeforeAfterSide | null;
}

/**
 * One marketing sample with a before image and a burned-in after image.
 *
 * Desktop shows both stills. Mobile fades between them every few seconds
 * until the visitor freezes Before or After. Tapping a still opens a
 * shared lightbox with both images so you can flip between them.
 */
const BeforeAfterRedactionCard: React.FunctionComponent<BeforeAfterRedactionCardProps> =
  React.memo(function BeforeAfterRedactionCard(props) {
    const {
      beforeSrc,
      afterSrc,
      beforeAlt,
      afterAlt,
      title,
      width,
      height,
      intervalMs = 3000,
      initialFrozenSideForTesting = null,
    } = props;
    const prefersReducedMotion = useReducedMotion();
    const [side, setSide] = useState<BeforeAfterSide>(
      initialFrozenSideForTesting ?? BeforeAfterSide.before
    );
    const [isFrozen, setIsFrozen] = useState(
      initialFrozenSideForTesting !== null
    );
    /** `null` means the lightbox is closed. 0 is Before, 1 is After. */
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const flipSide = useMemoizedCallback(() => {
      setSide((currentSide) =>
        currentSide === BeforeAfterSide.before
          ? BeforeAfterSide.after
          : BeforeAfterSide.before
      );
    }, []);
    // Pause while frozen or when the OS asks us not to animate.
    useInterval(flipSide, {
      delayMs: isFrozen || prefersReducedMotion ? null : intervalMs,
    });

    const freezeBefore = useMemoizedCallback(() => {
      setSide(BeforeAfterSide.before);
      setIsFrozen(true);
    }, []);
    const freezeAfter = useMemoizedCallback(() => {
      setSide(BeforeAfterSide.after);
      setIsFrozen(true);
    }, []);
    const openBeforeLightbox = useSetState(setLightboxIndex, 0);
    const openAfterLightbox = useSetState(setLightboxIndex, 1);
    const closeLightbox = useSetState(setLightboxIndex, null);
    const openVisibleLightbox = useMemoizedCallback(() => {
      setLightboxIndex(side === BeforeAfterSide.before ? 0 : 1);
    }, [side]);

    const commonImageProps: Pick<
      ImageProps,
      'width' | 'height' | 'w' | 'h' | 'mah' | 'fit' | 'radius'
    > = {
      width,
      height,
      w: '100%',
      // Next needs height:auto when CSS changes width, or the still
      // stays at the intrinsic height and mah clips the top.
      // https://nextjs.org/docs/app/api-reference/components/image#to-maintain-aspect-ratio
      h: 'auto',
      // Cap thumbnail height so cards in a row line up even when
      // the stills have different pixel sizes.
      mah: 360,
      fit: 'contain',
      radius: 'sm',
    };
    const slides: LightboxSlideData[] = [
      { src: beforeSrc, alt: beforeAlt, caption: 'Before' },
      { src: afterSrc, alt: afterAlt, caption: 'After' },
    ];

    return (
      <Card>
        <Stack gap="sm">
          <Text fw="bold">{title}</Text>
          <Box visibleFrom="sm">
            <SimpleGrid cols={2} spacing="sm">
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Before
                </Text>
                <ButtonDiv
                  className={classes.sampleImageButton}
                  display="block"
                  onClick={openBeforeLightbox}
                  aria-label="Open before sample fullscreen"
                >
                  <Image
                    {...commonImageProps}
                    src={beforeSrc}
                    alt={beforeAlt}
                  />
                </ButtonDiv>
              </Stack>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  After
                </Text>
                <ButtonDiv
                  className={classes.sampleImageButton}
                  display="block"
                  onClick={openAfterLightbox}
                  aria-label="Open after sample fullscreen"
                >
                  <Image {...commonImageProps} src={afterSrc} alt={afterAlt} />
                </ButtonDiv>
              </Stack>
            </SimpleGrid>
          </Box>
          <Box hiddenFrom="sm">
            <Stack gap="sm">
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  {side === BeforeAfterSide.before ? 'Before' : 'After'}
                </Text>
                <ButtonDiv
                  className={classes.sampleImageButton}
                  display="block"
                  onClick={openVisibleLightbox}
                  aria-label={`Open ${
                    side === BeforeAfterSide.before ? 'before' : 'after'
                  } sample fullscreen`}
                >
                  <Box
                    pos="relative"
                    data-testid={_mobileSampleImageTestId}
                    data-side={side}
                  >
                    <Fade visible={side === BeforeAfterSide.before}>
                      <Image
                        {...commonImageProps}
                        src={beforeSrc}
                        alt={beforeAlt}
                      />
                    </Fade>
                    <Box pos="absolute" inset={0}>
                      <Fade visible={side === BeforeAfterSide.after}>
                        <Image
                          {...commonImageProps}
                          src={afterSrc}
                          alt={afterAlt}
                        />
                      </Fade>
                    </Box>
                  </Box>
                </ButtonDiv>
              </Stack>
              <Group grow>
                {
                  // Filled means "this side is frozen." Auto-toggle keeps
                  // going until one of these is pressed.
                }
                <Button
                  size="sm"
                  variant={
                    isFrozen && side === BeforeAfterSide.before
                      ? 'filled'
                      : 'default'
                  }
                  keyboardShortcut={null}
                  onClick={freezeBefore}
                >
                  Before
                </Button>
                <Button
                  size="sm"
                  variant={
                    isFrozen && side === BeforeAfterSide.after
                      ? 'filled'
                      : 'default'
                  }
                  keyboardShortcut={null}
                  onClick={freezeAfter}
                  data-testid={_freezeAfterButtonTestId}
                >
                  After
                </Button>
              </Group>
            </Stack>
          </Box>
        </Stack>
        <Lightbox
          opened={lightboxIndex !== null}
          onClose={closeLightbox}
          slides={slides}
          currentIndex={lightboxIndex ?? 0}
          onIndexChange={setLightboxIndex}
          // Both stills share this lightbox so you can flip Before ↔ After.
          withNavigation
          withZoom
          closeOnClickOutside
        />
      </Card>
    );
  });

export default BeforeAfterRedactionCard;
