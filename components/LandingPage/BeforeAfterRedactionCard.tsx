'use client';

import React, { useEffect, useState } from 'react';
import { Box, Group, Modal, SimpleGrid, Stack, Text } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import Button from '../designSystem/Button/Button';
import ButtonDiv from '../designSystem/ButtonDiv';
import Card from '../designSystem/Card';
import Image from '../designSystem/Image';
import { useSetState } from '../../lib/hookUtilities/useSetState';
import classes from './BeforeAfterRedactionCard.module.css';

/** Which still the mobile card is showing or freezing. */
export enum BeforeAfterSide {
  before = 'before',
  after = 'after',
}

/** Flipping still so tests can assert which side is showing. */
export const _mobileSampleImageTestId = 'before-after-mobile-image';
/** After button so tests can freeze the flip. */
export const _freezeAfterButtonTestId = 'before-after-freeze-after';

export interface BeforeAfterRedactionCardProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  title: string;
  width: number;
  height: number;
  /** Auto-advance delay while neither side is frozen. */
  intervalMs?: number;
  /** Storybook / tests only — start frozen on one side. */
  initialFrozenSideForTesting?: BeforeAfterSide | null;
}

/**
 * One marketing sample with a before image and a burned-in after image.
 *
 * Desktop shows both stills. Mobile flips every few seconds until the
 * visitor freezes Before or After, and a tap opens a fullscreen lightbox.
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
    const [autoSide, setAutoSide] = useState<BeforeAfterSide>(
      BeforeAfterSide.before
    );
    /** Once set, the mobile still stays on this side. */
    const [frozenSide, setFrozenSide] = useState<BeforeAfterSide | null>(
      initialFrozenSideForTesting
    );
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const visibleSide = frozenSide ?? autoSide;

    // Flip every interval until the visitor freezes a side. Reduced-motion
    // visitors keep the first still instead of watching it animate.
    useEffect(() => {
      if (frozenSide !== null || prefersReducedMotion) {
        return undefined;
      }
      const intervalId = window.setInterval(() => {
        setAutoSide((side) =>
          side === BeforeAfterSide.before
            ? BeforeAfterSide.after
            : BeforeAfterSide.before
        );
      }, intervalMs);
      return () => window.clearInterval(intervalId);
    }, [frozenSide, intervalMs, prefersReducedMotion]);

    const handleFreezeBefore = useSetState(
      setFrozenSide,
      BeforeAfterSide.before
    );
    const handleFreezeAfter = useSetState(setFrozenSide, BeforeAfterSide.after);
    const openLightbox = useSetState(setIsLightboxOpen, true);
    const closeLightbox = useSetState(setIsLightboxOpen, false);

    return (
      <Card>
        <Stack gap="sm">
          <Text fw="bold">{title}</Text>
          <Box visibleFrom="sm">
            <SimpleGrid cols={2} spacing="sm">
              <SampleStill
                src={beforeSrc}
                alt={beforeAlt}
                width={width}
                height={height}
                label="Before"
                onOpen={null}
                imageTestId={null}
              />
              <SampleStill
                src={afterSrc}
                alt={afterAlt}
                width={width}
                height={height}
                label="After"
                onOpen={null}
                imageTestId={null}
              />
            </SimpleGrid>
          </Box>
          <Box hiddenFrom="sm">
            <Stack gap="sm">
              <SampleStill
                src={
                  visibleSide === BeforeAfterSide.before ? beforeSrc : afterSrc
                }
                alt={
                  visibleSide === BeforeAfterSide.before ? beforeAlt : afterAlt
                }
                width={width}
                height={height}
                label={
                  visibleSide === BeforeAfterSide.before ? 'Before' : 'After'
                }
                onOpen={openLightbox}
                imageTestId={_mobileSampleImageTestId}
              />
              <Group grow>
                {
                  // Filled means "this side is frozen." Auto-toggle keeps
                  // going until one of these is pressed.
                }
                <Button
                  size="sm"
                  variant={
                    frozenSide === BeforeAfterSide.before ? 'filled' : 'default'
                  }
                  keyboardShortcut={null}
                  onClick={handleFreezeBefore}
                >
                  Before
                </Button>
                <Button
                  size="sm"
                  variant={
                    frozenSide === BeforeAfterSide.after ? 'filled' : 'default'
                  }
                  keyboardShortcut={null}
                  onClick={handleFreezeAfter}
                  data-testid={_freezeAfterButtonTestId}
                >
                  After
                </Button>
              </Group>
            </Stack>
          </Box>
        </Stack>
        <Modal
          opened={isLightboxOpen}
          onClose={closeLightbox}
          fullScreen
          title={title}
        >
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <SampleStill
              src={beforeSrc}
              alt={beforeAlt}
              width={width}
              height={height}
              label="Before"
              onOpen={null}
              imageTestId={null}
            />
            <SampleStill
              src={afterSrc}
              alt={afterAlt}
              width={width}
              height={height}
              label="After"
              onOpen={null}
              imageTestId={null}
            />
          </SimpleGrid>
        </Modal>
      </Card>
    );
  });

export default BeforeAfterRedactionCard;

interface SampleStillProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  label: string;
  /** Pass a handler to make the still open the mobile lightbox. */
  onOpen: (() => unknown) | null;
  /** Test id on the image, or null when this still is not queried. */
  imageTestId: string | null;
}

/** One labeled still. Pass `onOpen` to make the image open the lightbox. */
const SampleStill: React.FunctionComponent<SampleStillProps> = React.memo(
  function SampleStill(props) {
    const { src, alt, width, height, label, onOpen, imageTestId } = props;

    return (
      <Stack gap={4}>
        <Text size="sm" c="dimmed">
          {label}
        </Text>
        {onOpen ? (
          <ButtonDiv
            className={classes.sampleImageButton}
            onClick={onOpen}
            aria-label={`Open ${label.toLowerCase()} sample fullscreen`}
          >
            <SampleImage
              src={src}
              alt={alt}
              width={width}
              height={height}
              testId={imageTestId}
            />
          </ButtonDiv>
        ) : (
          <SampleImage
            src={src}
            alt={alt}
            width={width}
            height={height}
            testId={imageTestId}
          />
        )}
      </Stack>
    );
  }
);

interface SampleImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  testId: string | null;
}

/** Shared still sizing so the tall passport and short 1040 crop match. */
const SampleImage: React.FunctionComponent<SampleImageProps> = React.memo(
  function SampleImage(props) {
    const { src, alt, width, height, testId } = props;
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        w="100%"
        // Cap height so both samples occupy a similar slot on the card.
        mah={360}
        fit="contain"
        radius="sm"
        data-testid={testId ?? undefined}
      />
    );
  }
);
