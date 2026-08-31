'use client';

import React, {
  forwardRef,
  PointerEvent,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import _ from 'lodash';
import {
  Box,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Stack,
} from '@mantine/core';
import { faEye, faEyeSlash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useCallbackWithPrefix } from '../../lib/hookUtilities/useCallbackWithPrefix';
import { useDebounce } from '../../lib/hookUtilities/useDebounce';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import {
  stopPropagation,
  useStopPropagation,
} from '../../lib/hookUtilities/useStopPropagation';
import { getUrlForRedactionImage } from '../../lib/storage/redactionImageUrl';
import ActionIcon from '../designSystem/ActionIcon';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import classes from './RedactionPreviewPages.module.css';
import { redactionPreviewPagesPadding } from './redactionLayout';
import type {
  BoundingBox,
  ManualRedactionBoundingBox,
  RedactedGetRedactionResponse,
  RedactionBoundingBox,
} from '../../lib/models/redactionTypes';

export interface RedactionPreviewPagesProps {
  redactionKey: string;
  redactionResponse: RedactedGetRedactionResponse;
  onScrolledPageChange: (page: number) => unknown;
  onContainerReady: () => unknown;
  zoomPercent: number;
  /**
   * Non-null while draw mode is on. The pages capture pointer drags and
   * call this with a normalized manual box.
   */
  onRedact: ((box: ManualRedactionBoundingBox) => unknown) | null;
  onDeleteBoundingBox: (box: RedactionBoundingBox) => unknown;
  onToggleBoundingBox: (box: RedactionBoundingBox) => unknown;
  /** Storybook / tests only — same shape as `getUrlForRedactionImage`. */
  getUrlForRedactionImageForTesting?: typeof getUrlForRedactionImage;
}

export interface RedactionPreviewPagesRef {
  scrollToPage: (page: number) => void;
  scrollToAndSelectBox: (box: RedactionBoundingBox) => void;
  getFitZoomPercent: (type: 'fitToWidth' | 'fitToPage') => number | null;
}

interface Point {
  clientX: number;
  clientY: number;
}

interface DrawingState {
  page: number;
  pointerId: number;
  start: Point;
  current: Point;
}

/**
 * Scrollable page images with normalized redaction overlays and draw mode.
 *
 * Each page sits on a gray canvas with a light drop shadow so the raster
 * looks like a stacked document rather than a full-bleed image.
 */
const RedactionPreviewPages = forwardRef<
  RedactionPreviewPagesRef,
  RedactionPreviewPagesProps
>(
  (
    props: RedactionPreviewPagesProps,
    ref: React.ForwardedRef<RedactionPreviewPagesRef>
  ) => {
    const {
      redactionKey,
      redactionResponse,
      onScrolledPageChange,
      onContainerReady,
      zoomPercent,
      onRedact,
      onDeleteBoundingBox,
      onToggleBoundingBox,
      getUrlForRedactionImageForTesting,
    } = props;
    const { pageSizes, redactionBoundingBoxes } = redactionResponse;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const pageRefs = useRef<Record<number, HTMLElement | null>>({});
    const boxRefs = useRef<Record<string, HTMLElement | null>>({});
    const currentPageRef = useRef(1);
    const hasNotifiedContainerReadyRef = useRef(false);
    const contentWidth = Math.max(
      0,
      ...pageSizes.map((pageSize) => pageSize.width * (zoomPercent / 100))
    );

    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const hasCenteredRef = useRef(false);
    const [isContainerReady, setIsContainerReady] = useState(false);
    const [selectedBoxKey, setSelectedBoxKey] = useState<string | null>(null);

    /**
     * Notify the parent once the padded canvas has a measurable width so
     * initial fit-to-width zoom can use the actual available content area.
     */
    const handleContainerResize = useMemoizedCallback((): void => {
      const container = containerRef.current;
      if (
        !container ||
        container.clientWidth === 0 ||
        hasNotifiedContainerReadyRef.current
      ) {
        return;
      }

      hasNotifiedContainerReadyRef.current = true;
      setIsContainerReady(true);
      onContainerReady();
      resizeObserverRef.current?.disconnect();
    }, [onContainerReady]);

    // Wait for a hidden mobile pane to become measurable before asking the
    // parent to initialize fit-to-width zoom.
    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return undefined;
      }
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserverRef.current = new ResizeObserver(handleContainerResize);
        resizeObserverRef.current.observe(container);
      }
      handleContainerResize();

      return (): void => {
        resizeObserverRef.current?.disconnect();
        resizeObserverRef.current = null;
      };
    }, [handleContainerResize]);

    // This intentionally runs only after the first measurable layout. The
    // ref prevents a later zoom or window resize from changing the user's
    // horizontal position.
    useLayoutEffect(() => {
      const container = containerRef.current;
      if (
        !isContainerReady ||
        hasCenteredRef.current ||
        !container ||
        container.clientWidth === 0
      ) {
        return;
      }

      container.scrollLeft = Math.max(
        0,
        (container.scrollWidth - container.clientWidth) / 2
      );
      hasCenteredRef.current = true;
    }, [isContainerReady]);

    const notifyPageChange = useDebounce(
      onScrolledPageChange,
      scrollNotificationDelayMs
    );

    const scrollToPage = useMemoizedCallback(
      (page: number): void => {
        const targetPage = _.clamp(page, 1, pageSizes.length || 1);
        const pageElement = pageRefs.current[targetPage];
        if (!pageElement) {
          return;
        }
        currentPageRef.current = targetPage;

        // Align the page's top with the scrollport so the next page is not
        // pulled into the middle of the canvas.
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        notifyPageChange(targetPage);
      },
      [notifyPageChange, pageSizes.length]
    );

    const scrollToAndSelectBox = useMemoizedCallback(
      (box: RedactionBoundingBox): void => {
        const boxKey = makeBoundingBoxKey(box);
        const boxElement = boxRefs.current[boxKey];
        if (!boxElement) {
          return;
        }
        currentPageRef.current = _.clamp(box.page, 1, pageSizes.length || 1);
        setSelectedBoxKey(boxKey);
        boxElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
        notifyPageChange(currentPageRef.current);
      },
      [notifyPageChange, pageSizes.length]
    );

    /**
     * Calculate fit zoom from the current page and the canvas content box.
     */
    const getFitZoomPercentForCurrentPage = useMemoizedCallback(
      (type: 'fitToWidth' | 'fitToPage'): number | null => {
        const pageSize = pageSizes[currentPageRef.current - 1];
        const container = containerRef.current;
        if (!pageSize || !container) {
          return null;
        }

        const computedStyle = window.getComputedStyle(container);
        const horizontalPadding =
          parseFloat(computedStyle.paddingLeft) +
          parseFloat(computedStyle.paddingRight);
        const verticalPadding =
          parseFloat(computedStyle.paddingTop) +
          parseFloat(computedStyle.paddingBottom);
        return _getFitZoomPercent({
          type,
          available: {
            width: container.clientWidth - horizontalPadding,
            height: container.clientHeight - verticalPadding,
          },
          pageSize,
        });
      },
      [pageSizes]
    );

    useImperativeHandle(
      ref,
      (): RedactionPreviewPagesRef => ({
        scrollToPage,
        scrollToAndSelectBox,
        getFitZoomPercent: getFitZoomPercentForCurrentPage,
      }),
      [getFitZoomPercentForCurrentPage, scrollToAndSelectBox, scrollToPage]
    );

    const notifyMostVisiblePage = useMemoizedCallback((): void => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const visiblePage = getMostVisiblePage(container, pageRefs.current);
      if (visiblePage !== null) {
        currentPageRef.current = visiblePage;
        onScrolledPageChange(visiblePage);
      }
    }, [onScrolledPageChange]);

    // Manual page-up/down and smooth scroll fire many observers; wait a beat
    // so the toolbar page number does not flicker through intermediate pages.
    const handleVisiblePageChange = useDebounce(
      notifyMostVisiblePage,
      visiblePageNotifyDebounceMs
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return undefined;
      }

      const observer =
        typeof IntersectionObserver === 'undefined'
          ? null
          : new IntersectionObserver(handleVisiblePageChange, {
              root: container,
              threshold: [0, 0.25, 0.5, 0.75, 1],
            });

      Object.values(pageRefs.current).forEach((pageElement) => {
        if (pageElement) {
          observer?.observe(pageElement);
        }
      });
      container.addEventListener('scroll', handleVisiblePageChange, {
        passive: true,
      });

      return (): void => {
        observer?.disconnect();
        container.removeEventListener('scroll', handleVisiblePageChange);
      };
    }, [handleVisiblePageChange, pageSizes.length]);

    // --- Drawing: pointer capture → normalized box → onRedact ---
    const [drawingState, setDrawingState] = useState<DrawingState | null>(null);

    const handlePointerDown = useMemoizedCallback(
      (page: number, event: PointerEvent<HTMLDivElement>): void => {
        if (onRedact === null) {
          return;
        }
        const point = getPointerPoint(event);
        event.currentTarget.setPointerCapture(event.pointerId);
        setSelectedBoxKey(null);
        setDrawingState({
          page,
          pointerId: event.pointerId,
          start: point,
          current: point,
        });
      },
      [onRedact]
    );

    const handlePointerMove = useMemoizedCallback(
      (event: PointerEvent<HTMLDivElement>): void => {
        setDrawingState((current) => {
          if (!current || current.pointerId !== event.pointerId) {
            return current;
          }
          const nextState: DrawingState = {
            ...current,
            current: getPointerPoint(event),
          };
          return nextState;
        });
      },
      []
    );

    const finishDrawing = useMemoizedCallback(
      (page: number, event: PointerEvent<HTMLDivElement>): void => {
        const current = drawingState;
        if (
          !current ||
          current.page !== page ||
          current.pointerId !== event.pointerId
        ) {
          return;
        }
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setDrawingState(null);
        if (onRedact === null) {
          return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const box = _clientRectToNormalizedBox(
          rect,
          current.start,
          getPointerPoint(event)
        );
        if (
          box.maxX - box.minX < minimumDrawSize ||
          box.maxY - box.minY < minimumDrawSize
        ) {
          return;
        }
        const manualBox: ManualRedactionBoundingBox = {
          type: 'manual',
          page,
          box,
          enabled: true,
        };
        onRedact(manualBox);
      },
      [drawingState, onRedact]
    );

    const cancelDrawing = useMemoizedCallback(
      (event: PointerEvent<HTMLDivElement>): void => {
        const current = drawingState;
        if (!current || current.pointerId !== event.pointerId) {
          return;
        }
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setDrawingState(null);
      },
      [drawingState]
    );

    // Prefix the page onto pointer handlers so each page image can share one
    // memoized draw implementation.
    const handlePointerDownWithPage = useCallbackWithPrefix<
      [number],
      [PointerEvent<HTMLDivElement>]
    >(handlePointerDown);
    const finishDrawingWithPage = useCallbackWithPrefix<
      [number],
      [PointerEvent<HTMLDivElement>]
    >(finishDrawing);

    // Prefix by box key, not the box object. Stringifying a box includes
    // `enabled`, so a toggle (or adding a drawn box) would miss the cache
    // and leave overlays with stale no-op handlers.
    const toggleBoxByKey = useMemoizedCallback(
      (boxKey: string): void => {
        const box = redactionBoundingBoxes.find(
          (candidate) => makeBoundingBoxKey(candidate) === boxKey
        );
        if (box) {
          onToggleBoundingBox(box);
        }
      },
      [onToggleBoundingBox, redactionBoundingBoxes]
    );
    const deleteBoxByKey = useMemoizedCallback(
      (boxKey: string): void => {
        const box = redactionBoundingBoxes.find(
          (candidate) => makeBoundingBoxKey(candidate) === boxKey
        );
        if (box) {
          onDeleteBoundingBox(box);
        }
      },
      [onDeleteBoundingBox, redactionBoundingBoxes]
    );
    const handleToggleBoundingBox =
      useCallbackWithPrefix<[string]>(toggleBoxByKey);
    const handleDeleteBoundingBox =
      useCallbackWithPrefix<[string]>(deleteBoxByKey);

    const setSelectedBoxOpened = useMemoizedCallback(
      (boxKey: string, opened: boolean): void => {
        setSelectedBoxKey(opened ? boxKey : null);
      },
      []
    );
    const handleSelectedChange = useCallbackWithPrefix<[string], [boolean]>(
      setSelectedBoxOpened
    );
    const setBoxElement = useMemoizedCallback(
      (boxKey: string, element: HTMLElement | null): void => {
        boxRefs.current[boxKey] = element;
      },
      []
    );
    const setBoxElementWithKey = useCallbackWithPrefix<
      [string],
      [HTMLElement | null]
    >(setBoxElement);

    // --- End drawing ---

    return (
      <Box
        ref={containerRef}
        flex={1}
        mih={0}
        p={redactionPreviewPagesPadding}
        bg="gray.2"
        style={{ overflow: 'auto' }}
      >
        <Stack align="center" gap="lg" w={contentWidth} miw="100%">
          {pageSizes.map((pageSize, index) => {
            const page = index + 1;
            const pageBoxes = redactionBoundingBoxes.filter(
              (redactionBox) => redactionBox.page === page
            );
            const width = pageSize.width * (zoomPercent / 100);
            const height = pageSize.height * (zoomPercent / 100);
            const imageUrl = (
              getUrlForRedactionImageForTesting ?? getUrlForRedactionImage
            )({ key: redactionKey, page });
            const draftBox =
              drawingState?.page === page
                ? _clientRectToNormalizedBox(
                    pageRefs.current[page]?.getBoundingClientRect() ??
                      emptyRect,
                    drawingState.start,
                    drawingState.current
                  )
                : null;

            return (
              <Box
                key={page}
                ref={(element: HTMLElement | null) => {
                  pageRefs.current[page] = element;
                }}
                component="section"
                id={`redaction-preview-page-${page}`}
                data-page={page}
                pos="relative"
                w={width}
                h={height}
                bg="white"
                bd="1px solid var(--mantine-color-gray-5)"
                flex="0 0 auto"
                style={{ boxShadow: 'var(--mantine-shadow-sm)' }}
              >
                <Box
                  pos="relative"
                  w="100%"
                  h="100%"
                  style={{
                    cursor: onRedact === null ? 'default' : 'crosshair',
                  }}
                  onPointerDown={handlePointerDownWithPage(page)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishDrawingWithPage(page)}
                  onPointerCancel={cancelDrawing}
                >
                  <Box
                    component="img"
                    src={imageUrl}
                    alt={`Page ${page}`}
                    w="100%"
                    h="100%"
                    display="block"
                    draggable={false}
                  />
                  {pageBoxes.map((redactionBox) => {
                    const boxKey = makeBoundingBoxKey(redactionBox);
                    return (
                      <RedactionBoxOverlay
                        key={boxKey}
                        redactionBox={redactionBox}
                        isSelected={selectedBoxKey === boxKey}
                        boxRef={setBoxElementWithKey(boxKey)}
                        onSelectedChange={handleSelectedChange(boxKey)}
                        onToggle={handleToggleBoundingBox(boxKey)}
                        onDelete={handleDeleteBoundingBox(boxKey)}
                      />
                    );
                  })}
                  {draftBox ? <DrawingOverlay box={draftBox} /> : null}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
    );
  }
);

export default RedactionPreviewPages;

/**
 * Convert a pointer drag in an image's client rectangle to normalized bounds.
 * Coordinates are clamped so dragging outside the image still creates a valid
 * box in the image coordinate system.
 */
export function _clientRectToNormalizedBox(
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  start: Point,
  end: Point
): BoundingBox {
  const width = rect.width || 1;
  const height = rect.height || 1;
  const startX = _.clamp((start.clientX - rect.left) / width, 0, 1);
  const startY = _.clamp((start.clientY - rect.top) / height, 0, 1);
  const endX = _.clamp((end.clientX - rect.left) / width, 0, 1);
  const endY = _.clamp((end.clientY - rect.top) / height, 0, 1);
  return {
    minX: Math.min(startX, endX),
    minY: Math.min(startY, endY),
    maxX: Math.max(startX, endX),
    maxY: Math.max(startY, endY),
  };
}

interface RedactionBoxOverlayProps {
  redactionBox: RedactionBoundingBox;
  isSelected: boolean;
  boxRef: (element: HTMLElement | null) => void;
  onSelectedChange: (isSelected: boolean) => unknown;
  onToggle: () => unknown;
  onDelete: () => unknown;
}

/**
 * Review overlay: a red outline with a clear center so the underlying text
 * stays readable. Hover and selection add a transparent fill only; the border
 * color stays the same. A click opens hide/delete actions.
 */
const RedactionBoxOverlay: React.FunctionComponent<RedactionBoxOverlayProps> =
  React.memo(function RedactionBoxOverlay(props: RedactionBoxOverlayProps) {
    const {
      redactionBox,
      isSelected,
      boxRef,
      onSelectedChange,
      onToggle,
      onDelete,
    } = props;
    const { box } = redactionBox;

    const handleSelectedChange = useMemoizedCallback(
      (opened: boolean): void => {
        onSelectedChange(opened);
      },
      [onSelectedChange]
    );

    const handleToggle = useStopPropagation(onToggle);
    const handleDelete = useStopPropagation(onDelete);

    const handleClick = useMemoizedCallback((): void => {
      onSelectedChange(true);
    }, [onSelectedChange]);

    return (
      <Popover
        opened={isSelected}
        onChange={handleSelectedChange}
        position="top"
        withArrow
        shadow="sm"
        withinPortal
      >
        <PopoverTarget>
          {
            // ButtonDiv needs children and is for rows with nested controls.
            // This hit target is empty and absolutely positioned, so Box is
            // the simpler wrapper.
          }
          <Box
            ref={boxRef}
            pos="absolute"
            top={`${box.minY * 100}%`}
            left={`${box.minX * 100}%`}
            w={`${(box.maxX - box.minX) * 100}%`}
            h={`${(box.maxY - box.minY) * 100}%`}
            bd={getOverlayBorder({
              enabled: redactionBox.enabled,
            })}
            className={classes.overlay}
            data-active={isSelected}
            role="button"
            tabIndex={0}
            aria-label={`Redaction on page ${redactionBox.page}`}
            onPointerDown={stopPropagation}
            onClick={handleClick}
          />
        </PopoverTarget>
        {
          // Popover content is portaled but still bubbles through React's
          // tree; stop pointerdown so draw mode does not capture action clicks.
        }
        <PopoverDropdown p="xs" onPointerDown={stopPropagation}>
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              tooltip="Toggle redaction on/off"
              variant="subtle"
              onClick={handleToggle}
            >
              <FontAwesomeIcon
                icon={redactionBox.enabled ? faEye : faEyeSlash}
              />
            </ActionIcon>
            <ActionIcon
              tooltip="Delete redaction"
              variant="subtle"
              onClick={handleDelete}
            >
              <FontAwesomeIcon icon={faXmark} />
            </ActionIcon>
          </Group>
        </PopoverDropdown>
      </Popover>
    );
  });

interface DrawingOverlayProps {
  box: BoundingBox;
}

/** In-progress drag rectangle shown only while the pointer is down. */
const DrawingOverlay: React.FunctionComponent<DrawingOverlayProps> = React.memo(
  function DrawingOverlay(props: DrawingOverlayProps) {
    const { box } = props;
    return (
      <Box
        pos="absolute"
        top={`${box.minY * 100}%`}
        left={`${box.minX * 100}%`}
        w={`${(box.maxX - box.minX) * 100}%`}
        h={`${(box.maxY - box.minY) * 100}%`}
        bg="rgba(255, 0, 0, 0.12)"
        bd="2px dashed var(--mantine-color-red-6)"
        style={{
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      />
    );
  }
);

function getPointerPoint(event: PointerEvent<HTMLDivElement>): Point {
  return { clientX: event.clientX, clientY: event.clientY };
}

function makeBoundingBoxKey({
  page,
  box,
}: {
  page: number;
  box: BoundingBox;
}): string {
  return [page, box.minX, box.minY, box.maxX, box.maxY].join(':');
}

function getMostVisiblePage(
  container: HTMLElement,
  pageElements: Record<number, HTMLElement | null>
): number | null {
  const containerRect = container.getBoundingClientRect();
  let mostVisiblePage: number | null = null;
  let mostVisiblePixels = 0;
  Object.entries(pageElements).forEach(([pageString, pageElement]) => {
    if (!pageElement) {
      return;
    }
    const pageRect = pageElement.getBoundingClientRect();
    const visiblePixels = Math.max(
      0,
      Math.min(pageRect.bottom, containerRect.bottom) -
        Math.max(pageRect.top, containerRect.top)
    );
    if (visiblePixels > mostVisiblePixels) {
      mostVisiblePage = Number(pageString);
      mostVisiblePixels = visiblePixels;
    }
  });
  return mostVisiblePage;
}

function getOverlayBorder({ enabled }: { enabled: boolean }): string {
  return enabled
    ? '2px solid var(--mantine-color-red-6)'
    : '2px dashed var(--mantine-color-gray-6)';
}

const minimumDrawSize = 0.01;
const scrollNotificationDelayMs = 300;
const visiblePageNotifyDebounceMs = 50;
const emptyRect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'> = {
  left: 0,
  top: 0,
  width: 1,
  height: 1,
};

interface FitZoomOptions {
  type: 'fitToWidth' | 'fitToPage';
  available: { width: number; height: number };
  pageSize: { width: number; height: number };
}

/**
 * Converts the available content box into a fit zoom. Menu-driven fitting
 * may exceed 100%; the initial load caps that separately.
 * Exported for tests.
 */
export function _getFitZoomPercent({
  type,
  available,
  pageSize,
}: FitZoomOptions): number {
  const widthPercent = (available.width / pageSize.width) * 100;
  const heightPercent = (available.height / pageSize.height) * 100;
  const fitPercent =
    type === 'fitToWidth'
      ? widthPercent
      : Math.min(widthPercent, heightPercent);
  // Floor the fit so the rendered page never exceeds the available space due
  // to rounding up, which would introduce an unnecessary scrollbar.
  return _.clamp(Math.floor(fitPercent), 1, 2000);
}
