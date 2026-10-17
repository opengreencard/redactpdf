import React from 'react';
import { Box, Group, Stack, Text } from '@mantine/core';
import Image from '../designSystem/Image';
import { irs1040Sample } from './landingRedactionSamples';
import LandingPageTag from './LandingPageTag';
import classes from './LandingPageHeroIllustration.module.css';

/**
 * Hero graphic of the review workspace, not a tilted labeled document.
 * The left rail + page canvas is the product UI visitors will actually use,
 * drawn over the same 1040 still as the before/after sample below.
 */
const LandingPageHeroIllustration: React.FunctionComponent = React.memo(
  function LandingPageHeroIllustration() {
    return (
      <Box pos="relative" aria-hidden>
        <Box
          bg="white"
          bd="1px solid var(--mantine-color-gray-3)"
          bdrs="md"
          // Lifted window; clip the page canvas to the rounded corners.
          style={{ overflow: 'hidden', boxShadow: 'var(--mantine-shadow-xl)' }}
        >
          <Group
            h={46}
            px="md"
            gap={10}
            wrap="nowrap"
            className={classes.windowHeader}
          >
            <Text size="sm" fw="bold" style={{ whiteSpace: 'nowrap' }}>
              Review redactions
            </Text>
            <Text size="sm" c="gray.6" visibleFrom="sm">
              · irs-1040.pdf
            </Text>
            <Box ml="auto">
              <LandingPageTag withCheck={false}>
                AI found 4 items
              </LandingPageTag>
            </Box>
          </Group>
          <Group
            h={{ base: 250, sm: 340 }}
            gap={0}
            wrap="nowrap"
            align="stretch"
          >
            <Stack
              visibleFrom="sm"
              w={168}
              gap={0}
              px="sm"
              py={14}
              className={classes.rail}
              style={{ flexShrink: 0 }}
            >
              <Text
                fz={11}
                fw="normal"
                tt="uppercase"
                lts="0.04em"
                c="gray.6"
                mx={4}
                mb="sm"
              >
                Detected
              </Text>
              {detectionLabels.map((label, index) => (
                <Group
                  key={label}
                  gap="sm"
                  px="sm"
                  py={7}
                  bdrs="sm"
                  bg={index === 0 ? 'green.0' : undefined}
                  wrap="nowrap"
                >
                  <Box w={22} h={9} bg="gray.9" bdrs={2} />
                  <Text size="sm">{label}</Text>
                </Group>
              ))}
              <Box
                mt={14}
                mx={4}
                h={32}
                bg="green.7"
                c="white"
                bdrs="sm"
                fz="sm"
                fw="normal"
                display="grid"
                style={{ placeItems: 'center' }}
              >
                Download
              </Box>
            </Stack>
            <Box
              flex={1}
              bg="gray.2"
              pos="relative"
              style={{ overflow: 'hidden' }}
            >
              <Box
                pos="absolute"
                left={16}
                top={20}
                // Narrow enough that the form's top-right (the "2024" year
                // box and the State field) stays inside the canvas.
                w={520}
                bg="white"
                style={{ boxShadow: 'var(--mantine-shadow-xs)' }}
              >
                <Image
                  src={irs1040Sample.beforeSrc}
                  alt=""
                  width={irs1040Sample.width}
                  height={irs1040Sample.height}
                  w="100%"
                  h="auto"
                  // The hero still is the landing page's LCP element.
                  preload
                />
                {suggestionBoxes.map((box) => (
                  <Box
                    key={`${box.left}-${box.top}`}
                    pos="absolute"
                    className={
                      box.isSelected
                        ? `${classes.suggestion} ${classes.selectedSuggestion}`
                        : classes.suggestion
                    }
                    style={{
                      left: `${box.left}%`,
                      top: `${box.top}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Group>
        </Box>
        <Stack
          pos="absolute"
          // Hang off the window's left edge only once the hero has side
          // room for it; at tablet widths a negative offset gets clipped.
          left={{ base: 12, md: -28 }}
          bottom={{ base: -18, sm: -22 }}
          gap={1}
          bg="white"
          bd="1px solid var(--mantine-color-gray-3)"
          bdrs="sm"
          px={14}
          py={11}
          style={{ boxShadow: 'var(--mantine-shadow-md)' }}
        >
          <Text size="sm" fw="bold">
            IRS Form 1040
          </Text>
          <Text size="xs" c="gray.6" ff="monospace">
            12 boxes · 2 pages
          </Text>
        </Stack>
      </Box>
    );
  }
);

const detectionLabels: string[] = ['Name', 'Address', 'SSN', 'Email'];

interface SuggestionBox {
  /** Percent of the page width/height, matching the 1040 still. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Selected boxes get a translucent fill, like the review screen. */
  isSelected: boolean;
}

// Positions of the name, SSN, and address fields on the 1040 still.
const suggestionBoxes: SuggestionBox[] = [
  { left: 2.1, top: 11.4, width: 4.5, height: 1.3, isSelected: true },
  { left: 39.1, top: 11.3, width: 3.7, height: 1.3, isSelected: false },
  { left: 81.4, top: 11.3, width: 13.1, height: 1.3, isSelected: false },
  { left: 2.0, top: 14.5, width: 3.8, height: 1.1, isSelected: true },
  { left: 39.0, top: 14.5, width: 6.8, height: 1.1, isSelected: true },
  { left: 81.3, top: 14.5, width: 13.3, height: 1.3, isSelected: false },
  { left: 2.1, top: 17.4, width: 21.3, height: 1.4, isSelected: false },
  { left: 2.1, top: 20.3, width: 9.6, height: 1.3, isSelected: false },
  { left: 57.9, top: 20.2, width: 2.0, height: 1.2, isSelected: false },
  { left: 68.9, top: 20.5, width: 4.9, height: 1.2, isSelected: false },
];

export default LandingPageHeroIllustration;
