import React from 'react';
import { Box, Container, Grid, GridCol, Stack } from '@mantine/core';
import { APICallState } from '../../lib/typescript/apiCallState';
import { getUnreachableError } from '../../lib/typescript/getUnreachableError';
import { useConvertSingleArgumentToArray } from '../../lib/hookUtilities/useConvertSingleArgumentToArray';
import {
  GetRedactionResponse,
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
  RedactionStatus,
} from '../../lib/models/redactionTypes';
import RedactionError from './RedactionError';
import RedactionPanel from './RedactionPanel';
import RedactionPreview from './RedactionPreview';
import RedactionProgress from './RedactionProgress';
import { redactionPageContainerSize } from './redactionLayout';

export interface RedactionPageInnerProps {
  redactionKey: string;
  redactionState: APICallState<GetRedactionResponse> | null;
  onAddBoundingBox: (box: ManualRedactionBoundingBox) => unknown;
  onDeleteBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
  onToggleBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
  highlightedBox: RedactionBoundingBox | null;
  onRedactionClick: (box: RedactionBoundingBox) => unknown;
}

/**
 * Presentational `/redact/:key` review UI. The outer page owns polling and
 * mutations; this component only switches loading / error / loaded.
 */
const RedactionPageInner: React.FunctionComponent<RedactionPageInnerProps> =
  React.memo(function RedactionPageInner(props: RedactionPageInnerProps) {
    const {
      redactionKey,
      redactionState,
      onAddBoundingBox,
      onDeleteBoundingBoxes,
      onToggleBoundingBoxes,
      highlightedBox,
      onRedactionClick,
    } = props;
    const view = getRedactionPageView(redactionState);

    return (
      <Stack
        gap={0}
        flex={1}
        py="xl"
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
          highlightedBox={highlightedBox}
          onRedactionClick={onRedactionClick}
        />
      </Stack>
    );
  });

export default RedactionPageInner;

enum RedactionPageView {
  loading = 'loading',
  error = 'error',
  loaded = 'loaded',
}

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
  highlightedBox: RedactionBoundingBox | null;
  onRedactionClick: (box: RedactionBoundingBox) => unknown;
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
      highlightedBox,
      onRedactionClick,
    } = props;
    const handleDeleteBoundingBox = useConvertSingleArgumentToArray(
      onDeleteBoundingBoxes
    );
    const handleToggleBoundingBox = useConvertSingleArgumentToArray(
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
          <Container
            size={redactionPageContainerSize}
            px="md"
            flex={1}
            w="100%"
            display="flex"
          >
            <Grid flex={1}>
              <GridCol span={{ base: 12, md: 3 }} display="flex">
                <Box flex={1} w="100%" style={{ overflowY: 'auto' }}>
                  <RedactionPanel
                    redactionKey={redactionKey}
                    redaction={redaction}
                    onRedactionClick={onRedactionClick}
                    onDeleteBoundingBoxes={onDeleteBoundingBoxes}
                    onToggleBoundingBoxes={onToggleBoundingBoxes}
                  />
                </Box>
              </GridCol>
              <GridCol span={{ base: 12, md: 9 }}>
                <RedactionPreview
                  redactionKey={redactionKey}
                  pageCount={redaction.pageCount}
                  redactionBoundingBoxes={redaction.redactionBoundingBoxes}
                  onAddBoundingBox={onAddBoundingBox}
                  onDeleteBoundingBox={handleDeleteBoundingBox}
                  onToggleBoundingBox={handleToggleBoundingBox}
                  scrollToBox={highlightedBox}
                />
              </GridCol>
            </Grid>
          </Container>
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
          throw getUnreachableError(result.status);
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
): GetRedactionResponse {
  if (
    redactionState &&
    redactionState.status !== 'error' &&
    redactionState.result &&
    redactionState.result.status === RedactionStatus.redacted
  ) {
    return redactionState.result;
  }

  throw new Error('Loaded view requires a redacted GetRedactionResponse');
}
