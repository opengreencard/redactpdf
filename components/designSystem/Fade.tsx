'use client';

import React from 'react';
import { Box } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';

export interface FadeProps {
  /** When false, the child stays mounted at opacity 0. */
  visible: boolean;
  children: React.ReactNode;
  /** Fade length in ms. We ignore this when the OS wants less motion. */
  durationMs?: number;
}

/**
 * Fade a child in or out without unmounting it.
 *
 * Mantine `Transition` is built for mount/unmount. We keep both stills in
 * the tree so one can fade in on top of the other. Reduced-motion visitors
 * get an instant swap.
 */
const Fade: React.FunctionComponent<FadeProps> = React.memo(function Fade(
  props: FadeProps
) {
  const { visible, children, durationMs = 400 } = props;
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : durationMs;

  return (
    <Box
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${duration}ms ease`,
        // The hidden still should not steal taps from the one on top.
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {children}
    </Box>
  );
});

export default Fade;
