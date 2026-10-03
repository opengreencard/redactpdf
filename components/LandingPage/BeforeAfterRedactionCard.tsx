'use client';

import React, { useState } from 'react';
import { Box, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import Button from '../designSystem/Button/Button';
import Card from '../designSystem/Card';
import Fade from '../designSystem/Fade';
import ImageWithLightbox, {
  type ImageWithLightboxProps,
} from '../designSystem/ImageWithLightbox';
import { useInterval } from '../../lib/hookUtilities/useInterval';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';

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
 * until the visitor freezes Before or After. Tapping a still opens that
 * image in a fullscreen lightbox.
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

    const commonImageProps: Pick<ImageWithLightboxProps, 'width' | 'height'> = {
      width,
      height,
    };

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
                <ImageWithLightbox
                  {...commonImageProps}
                  src={beforeSrc}
                  alt={beforeAlt}
                  caption="Before"
                />
              </Stack>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  After
                </Text>
                <ImageWithLightbox
                  {...commonImageProps}
                  src={afterSrc}
                  alt={afterAlt}
                  caption="After"
                />
              </Stack>
            </SimpleGrid>
          </Box>
          <Box hiddenFrom="sm">
            <Stack gap="sm">
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  {side === BeforeAfterSide.before ? 'Before' : 'After'}
                </Text>
                <Box
                  pos="relative"
                  data-testid={_mobileSampleImageTestId}
                  data-side={side}
                >
                  <Fade visible={side === BeforeAfterSide.before}>
                    <ImageWithLightbox
                      {...commonImageProps}
                      src={beforeSrc}
                      alt={beforeAlt}
                      caption="Before"
                    />
                  </Fade>
                  <Box pos="absolute" inset={0}>
                    <Fade visible={side === BeforeAfterSide.after}>
                      <ImageWithLightbox
                        {...commonImageProps}
                        src={afterSrc}
                        alt={afterAlt}
                        caption="After"
                      />
                    </Fade>
                  </Box>
                </Box>
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
      </Card>
    );
  });

export default BeforeAfterRedactionCard;
