import React from 'react';
import { Box, Group, Stack, Text } from '@mantine/core';
import Image from '../designSystem/Image';
import { irs1040Sample } from './landingRedactionSamples';
import { redactionOverlayBorder } from '../Redaction/redactionLayout';
import LandingPageTag from './LandingPageTag';
import rules from '../designSystem/Rule.module.css';
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
        {
          // Tuned by eye; no spec.
        }
        <Box
          bg="white"
          bd="1px solid var(--mantine-color-gray-3)"
          bdrs="md"
          // Lifted window; clip the page canvas to the rounded corners.
          style={{ overflow: 'hidden', boxShadow: 'var(--mantine-shadow-xl)' }}
        >
          <Group h={46} px="md" gap="sm" wrap="nowrap" className={rules.bottom}>
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
              py="md"
              className={rules.right}
              style={{ flexShrink: 0 }}
            >
              <Text
                fz={11}
                fw="normal"
                tt="uppercase"
                lts="0.04em"
                c="gray.6"
                mx="xs"
                mb="sm"
              >
                Detected
              </Text>
              {detectionLabels.map((label, index) => (
                <Group
                  key={label}
                  gap="sm"
                  px="sm"
                  py="sm"
                  bdrs="sm"
                  bg={index === 0 ? 'green.0' : undefined}
                  wrap="nowrap"
                >
                  <Box w={22} h={9} bg="gray.9" bdrs={2} />
                  <Text size="sm">{label}</Text>
                </Group>
              ))}
              <Box
                mt="md"
                mx="xs"
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
                    // Border value is shared with the real redaction overlay.
                    bd={redactionOverlayBorder}
                    className={
                      box.isSelected ? classes.selectedSuggestion : undefined
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
          px="md"
          py="sm"
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

export default LandingPageHeroIllustration;

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

// Positions of the name, SSN, and address fields on the 1040 still. Each box is
// the label's ink plus 5px (3px clearance and the 2px border) at the 520px mock
// width, so the border-box outline encloses the text.
const suggestionBoxes: SuggestionBox[] = [
  { left: 0.96, top: 11.05, width: 6.33, height: 2.34, isSelected: true },
  { left: 37.84, top: 11.13, width: 6.11, height: 2.27, isSelected: false },
  { left: 80.6, top: 10.9, width: 14.71, height: 2.34, isSelected: false },
  { left: 0.96, top: 13.87, width: 6, height: 2.34, isSelected: true },
  { left: 38.18, top: 13.87, width: 8.48, height: 2.34, isSelected: true },
  { left: 80.03, top: 14.1, width: 15.05, height: 2.34, isSelected: false },
  { left: 1.19, top: 16.99, width: 22.62, height: 2.58, isSelected: false },
  { left: 1.41, top: 20.12, width: 11.31, height: 2.34, isSelected: false },
  { left: 56.62, top: 19.65, width: 4.19, height: 2.34, isSelected: false },
  { left: 67.93, top: 20.12, width: 6.9, height: 2.34, isSelected: false },
];
