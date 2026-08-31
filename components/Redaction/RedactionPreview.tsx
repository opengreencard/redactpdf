'use client';

import React, { RefObject, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import { Box, Stack } from '@mantine/core';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import type { RequiredWithUndefined } from '../../lib/typescript/requiredWithUndefined';
import type { ManualRedactionBoundingBox } from '../../lib/models/redactionTypes';
import RedactionPreviewPages, {
  RedactionPreviewPagesProps,
  RedactionPreviewPagesRef,
} from './RedactionPreviewPages';
import RedactionPreviewToolbar, {
  RedactionPreviewToolbarProps,
  RedactionPreviewZoom,
} from './RedactionPreviewToolbar';
import { redactionPaneBorder } from './redactionLayout';

interface RedactionPreviewOwnProps {
  onAddBoundingBox: (box: ManualRedactionBoundingBox) => unknown;
  /**
   * Pass a ref to scroll to a particular page from outside this component.
   */
  redactionPreviewPagesRef?: RefObject<RedactionPreviewPagesRef | null>;
  /** Storybook / tests only — start with draw mode on. */
  initialIsRedactingForTesting?: boolean;
}

/**
 * Caller-supplied extras forwarded to the toolbar. Preview owns page, zoom,
 * and draw-mode state, so those fields are omitted.
 */
export type RedactionPreviewToolbarPassThroughProps = Omit<
  RedactionPreviewToolbarProps,
  | 'pageCount'
  | 'page'
  | 'onPageChange'
  | 'zoomPercent'
  | 'onZoomChange'
  | 'isRedacting'
  | 'onIsRedactingChange'
>;

/**
 * Testing-only image URL override forwarded to the page canvas.
 */
export type RedactionPreviewPagesPassThroughProps = Pick<
  RedactionPreviewPagesProps,
  'getUrlForRedactionImageForTesting'
>;

export interface RedactionPreviewProps
  extends
    RedactionPreviewOwnProps,
    Pick<
      RedactionPreviewPagesProps,
      | 'redactionKey'
      | 'redactionResponse'
      | 'onDeleteBoundingBox'
      | 'onToggleBoundingBox'
    >,
    RedactionPreviewToolbarPassThroughProps,
    RedactionPreviewPagesPassThroughProps {}

/** Composes the preview toolbar and scrollable, editable page canvas. */
const RedactionPreview: React.FunctionComponent<RedactionPreviewProps> =
  React.memo(function RedactionPreview(props: RedactionPreviewProps) {
    const {
      redactionKey,
      redactionResponse,
      onAddBoundingBox,
      onDeleteBoundingBox,
      onToggleBoundingBox,
      redactionPreviewPagesRef,
      initialIsRedactingForTesting = false,
      ...passThroughProps
    } = props;
    const _ownProps: RequiredWithUndefined<RedactionPreviewOwnProps> = {
      onAddBoundingBox,
      redactionPreviewPagesRef,
      initialIsRedactingForTesting,
    };

    const { getUrlForRedactionImageForTesting, ...toolbarPassThroughProps } =
      passThroughProps;

    const internalPagesRef = useRef<RedactionPreviewPagesRef | null>(null);
    const pagesRef = redactionPreviewPagesRef ?? internalPagesRef;

    const [internalPage, setPage] = useState(1);
    const [zoomPercent, setZoomPercent] = useState(100);
    const [isRedacting, setIsRedacting] = useState(
      initialIsRedactingForTesting
    );

    const pageCount = redactionResponse.pageSizes.length;
    const page = useMemo(
      () => _.clamp(internalPage, 1, pageCount || 1),
      [internalPage, pageCount]
    );

    const handleContainerReady = useMemoizedCallback((): void => {
      const fitZoomPercent = pagesRef.current?.getFitZoomPercent('fitToWidth');
      if (fitZoomPercent !== null && fitZoomPercent !== undefined) {
        // First paint should fill the pane without enlarging past native
        // size. Menu "Fit to width" may exceed 100%.
        setZoomPercent(Math.min(fitZoomPercent, 100));
      }
    }, [pagesRef]);

    const handlePageChange = useMemoizedCallback(
      (nextPage: number): void => {
        const clampedPage = _.clamp(nextPage, 1, pageCount || 1);
        setPage(clampedPage);
        pagesRef.current?.scrollToPage(clampedPage);
      },
      [pageCount, pagesRef]
    );

    const handleScrolledPageChange = useMemoizedCallback(
      (nextPage: number) => {
        setPage(_.clamp(nextPage, 1, pageCount || 1));
      },
      [pageCount]
    );

    // Pages owns the content-box measurement and shared fit calculation.
    const handleZoomChange = useMemoizedCallback(
      (zoom: RedactionPreviewZoom): void => {
        if (zoom.type === 'percent') {
          setZoomPercent(_.clamp(zoom.percent, 1, 2000));
          return;
        }

        const fitZoomPercent = pagesRef.current?.getFitZoomPercent(zoom.type);
        if (fitZoomPercent !== null && fitZoomPercent !== undefined) {
          setZoomPercent(fitZoomPercent);
        }
      },
      [pagesRef]
    );

    return (
      <Stack
        gap="sm"
        // Fill the grid column so the page canvas, not the toolbar, scrolls.
        // mih={0} lets this flex child shrink below its intrinsic height.
        // h="100%" keeps the stack as tall as the surrounding column.
        flex={1}
        mih={0}
        // Allow wide, zoomed pages to scroll inside the canvas instead of
        // expanding the grid column and the surrounding page.
        miw={0}
        h="100%"
        bg="gray.2"
        aria-label={`Preview for ${redactionKey}`}
      >
        <Box
          bg="white"
          w="100%"
          py="xs"
          px={{ base: 'xs', xs: 0 }}
          style={{ borderBottom: redactionPaneBorder }}
        >
          <RedactionPreviewToolbar
            {...toolbarPassThroughProps}
            pageCount={pageCount}
            page={page}
            onPageChange={handlePageChange}
            zoomPercent={zoomPercent}
            onZoomChange={handleZoomChange}
            isRedacting={isRedacting}
            onIsRedactingChange={setIsRedacting}
          />
        </Box>
        <RedactionPreviewPages
          ref={pagesRef}
          redactionKey={redactionKey}
          redactionResponse={redactionResponse}
          onScrolledPageChange={handleScrolledPageChange}
          onContainerReady={handleContainerReady}
          zoomPercent={zoomPercent}
          onRedact={isRedacting ? onAddBoundingBox : null}
          onDeleteBoundingBox={onDeleteBoundingBox}
          onToggleBoundingBox={onToggleBoundingBox}
          getUrlForRedactionImageForTesting={getUrlForRedactionImageForTesting}
        />
      </Stack>
    );
  });

export default RedactionPreview;
