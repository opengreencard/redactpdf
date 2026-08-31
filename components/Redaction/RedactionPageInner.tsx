'use client';

import React, { useRef, useState } from 'react';
import {
  Box,
  Grid,
  GridCol,
  SegmentedControl,
  Stack,
  type SegmentedControlItem,
} from '@mantine/core';
import { APICallState } from '../../lib/typescript/apiCallState';
import { getUnreachableError } from '../../lib/typescript/getUnreachableError';
import { useConvertSingleArgumentToArray } from '../../lib/hookUtilities/useConvertSingleArgumentToArray';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { delay } from '../../lib/utilities/delay';
import {
  GetRedactionResponse,
  RedactedGetRedactionResponse,
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
  RedactionStatus,
} from '../../lib/models/redactionTypes';
import RedactionError from './RedactionError';
import RedactionPanel from './RedactionPanel';
import { getRedactionImageUrl } from '../../lib/storage/getRedactionImageUrl';
import RedactionPreview, {
  RedactionPreviewPagesPassThroughProps,
} from './RedactionPreview';
import { RedactionPreviewPagesRef } from './RedactionPreviewPages';
import RedactionProgress from './RedactionProgress';
import SiteChrome from '../SiteChrome/SiteChrome';
import { redactionPaneBorder } from './redactionLayout';

enum MobileRedactionView {
  review = 'review',
  document = 'document',
}

export interface RedactionPageInnerProps extends RedactionPreviewPagesPassThroughProps {
  redactionKey: string;
  redactionState: APICallState<GetRedactionResponse> | null;
  isLoggedIn: boolean;
  onAddBoundingBox: (box: ManualRedactionBoundingBox) => unknown;
  onDeleteBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
  onToggleBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
}

/**
 * Presentational `/redact/:key` review UI. The outer page owns polling and
 * mutations; this component switches loading / error / loaded while the
 * loaded view coordinates list clicks with the preview.
 */
const RedactionPageInner: React.FunctionComponent<RedactionPageInnerProps> =
  React.memo(function RedactionPageInner(props: RedactionPageInnerProps) {
    const {
      redactionKey,
      redactionState,
      isLoggedIn,
      onAddBoundingBox,
      onDeleteBoundingBoxes,
      onToggleBoundingBoxes,
      getUrlForRedactionImageForTesting,
    } = props;
    const view = getRedactionPageView(redactionState);

    return (
      <SiteChrome
        isLoggedIn={isLoggedIn}
        containerSize="none"
        fullHeight
        showFooter={false}
      >
        <Stack
          gap={0}
          flex={1}
          mih={0}
          w="100%"
          aria-label={`Redaction ${redactionKey}`}
        >
          <RedactionPageViewBody
            view={view}
            redactionKey={redactionKey}
            redactionState={redactionState}
            onAddBoundingBox={onAddBoundingBox}
            onDeleteBoundingBoxes={onDeleteBoundingBoxes}
            onToggleBoundingBoxes={onToggleBoundingBoxes}
            getUrlForRedactionImageForTesting={
              getUrlForRedactionImageForTesting
            }
          />
        </Stack>
      </SiteChrome>
    );
  });

export default RedactionPageInner;

enum RedactionPageView {
  loading = 'loading',
  error = 'error',
  loaded = 'loaded',
}

const mobileRedactionViewOptions: SegmentedControlItem<MobileRedactionView>[] =
  [
    { value: MobileRedactionView.review, label: 'Review' },
    { value: MobileRedactionView.document, label: 'Document' },
  ];

/**
 * Props shared by the three render states: loading, error, and loaded.
 * Only the loaded state uses the box-edit callbacks and preview.
 */
interface RedactionPageViewBodyProps {
  view: RedactionPageView;
  redactionKey: string;
  redactionState: APICallState<GetRedactionResponse> | null;
  onAddBoundingBox: (box: ManualRedactionBoundingBox) => unknown;
  onDeleteBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
  onToggleBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
  getUrlForRedactionImageForTesting: typeof getRedactionImageUrl | undefined;
}

const RedactionPageViewBody: React.FunctionComponent<RedactionPageViewBodyProps> =
  React.memo(function RedactionPageViewBody(props: RedactionPageViewBodyProps) {
    const {
      view,
      redactionKey,
      redactionState,
      onAddBoundingBox,
      onDeleteBoundingBoxes,
      onToggleBoundingBoxes,
      getUrlForRedactionImageForTesting,
    } = props;
    const redactionPreviewPagesRef = useRef<RedactionPreviewPagesRef>(null);
    const [mobileView, setMobileView] = useState<MobileRedactionView>(
      MobileRedactionView.review
    );

    /**
     * Handle a click on a redaction on the left side. Scroll to the box in
     * the document pane.
     */
    const handleRedactionClick = useMemoizedCallback(
      async (box: RedactionBoundingBox): Promise<void> => {
        setMobileView(MobileRedactionView.document);
        // Let the Document pane become display: flex before measuring and
        // scrolling the overlay. This is a no-op on desktop.
        await delay(0);
        redactionPreviewPagesRef.current?.scrollToAndSelectBox(box);
      },
      []
    );
    const onDeleteBoundingBox = useConvertSingleArgumentToArray(
      onDeleteBoundingBoxes
    );
    const onToggleBoundingBox = useConvertSingleArgumentToArray(
      onToggleBoundingBoxes
    );

    switch (view) {
      case RedactionPageView.loading: {
        const progress = getProgressProps(redactionState);
        return <RedactionProgress redaction={progress} />;
      }
      case RedactionPageView.error:
        return <RedactionError message={getErrorMessage(redactionState)} />;
      case RedactionPageView.loaded: {
        const redaction = getLoadedRedaction(redactionState);
        return (
          <Stack gap="md" flex={1} mih={0} w="100%">
            <Box px="md" hiddenFrom="sm">
              <SegmentedControl
                fullWidth
                data={mobileRedactionViewOptions}
                value={mobileView}
                onChange={setMobileView}
              />
            </Box>
            <Grid
              flex={1}
              mih={0}
              h="100%"
              w="100%"
              // Mantine's columns live in an inner flex element; give that
              // element the row height so each pane can shrink and scroll.
              styles={{ inner: { height: '100%' } }}
            >
              {
                // The responsive display prop provides a Mantine equivalent
                // of a mobile-only display utility while keeping both panes
                // mounted, so switching tabs preserves their scroll state.
              }
              <GridCol
                span={{ base: 12, sm: 3 }}
                mih={0}
                h="100%"
                p={0}
                display={{
                  base:
                    mobileView === MobileRedactionView.review ? 'flex' : 'none',
                  sm: 'flex',
                }}
              >
                <Box
                  flex={1}
                  mih={0}
                  h="100%"
                  style={{ borderRight: redactionPaneBorder }}
                >
                  <RedactionPanel
                    redactionKey={redactionKey}
                    redaction={redaction}
                    onRedactionClick={handleRedactionClick}
                    onDeleteBoundingBoxes={onDeleteBoundingBoxes}
                    onToggleBoundingBoxes={onToggleBoundingBoxes}
                  />
                </Box>
              </GridCol>
              <GridCol
                span={{ base: 12, sm: 9 }}
                mih={0}
                miw={0}
                h="100%"
                p={0}
                display={{
                  base:
                    mobileView === MobileRedactionView.document
                      ? 'flex'
                      : 'none',
                  sm: 'flex',
                }}
              >
                <RedactionPreview
                  redactionKey={redactionKey}
                  redactionResponse={redaction}
                  onAddBoundingBox={onAddBoundingBox}
                  onDeleteBoundingBox={onDeleteBoundingBox}
                  onToggleBoundingBox={onToggleBoundingBox}
                  redactionPreviewPagesRef={redactionPreviewPagesRef}
                  getUrlForRedactionImageForTesting={
                    getUrlForRedactionImageForTesting
                  }
                />
              </GridCol>
            </Grid>
          </Stack>
        );
      }
      default:
        throw getUnreachableError(view);
    }
  });

function getRedactionPageView(
  redactionState: APICallState<GetRedactionResponse> | null
): RedactionPageView {
  if (redactionState === null) {
    return RedactionPageView.loading;
  }

  switch (redactionState.status) {
    case 'error':
      return RedactionPageView.error;
    case 'inProgress':
    case 'done': {
      const { result } = redactionState;
      if (!result) {
        return RedactionPageView.loading;
      }
      switch (result.status) {
        case RedactionStatus.redacting:
          return RedactionPageView.loading;
        case RedactionStatus.error:
          return RedactionPageView.error;
        case RedactionStatus.redacted:
          return RedactionPageView.loaded;
        default:
          throw getUnreachableError(result);
      }
    }
    default:
      throw getUnreachableError(redactionState);
  }
}

interface ProgressProps {
  pageCount: number;
  createdAt: string;
}

function getProgressProps(
  redactionState: APICallState<GetRedactionResponse> | null
): ProgressProps {
  if (
    redactionState &&
    redactionState.status !== 'error' &&
    redactionState.result
  ) {
    const props: ProgressProps = {
      pageCount: redactionState.result.pageCount,
      createdAt: redactionState.result.createdAt,
    };
    return props;
  }

  const props: ProgressProps = {
    pageCount: 1,
    createdAt: '1970-01-01T00:00:00.000Z',
  };
  return props;
}

function getErrorMessage(
  redactionState: APICallState<GetRedactionResponse> | null
): string | null {
  if (redactionState?.status === 'error') {
    return redactionState.error;
  }
  return null;
}

function getLoadedRedaction(
  redactionState: APICallState<GetRedactionResponse> | null
): RedactedGetRedactionResponse {
  if (
    redactionState &&
    redactionState.status !== 'error' &&
    redactionState.result?.status === RedactionStatus.redacted
  ) {
    return redactionState.result;
  }

  throw new Error('Loaded view requires a redacted GetRedactionResponse');
}
