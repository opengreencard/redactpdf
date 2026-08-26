'use client';

import React from 'react';
import { Stack, Text } from '@mantine/core';
import Button from '../designSystem/Button/Button';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import type {
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import { getRedactionBoxLabel } from './redactionBoundingBoxes';

export interface RedactionPreviewProps {
  redactionKey: string;
  pageCount: number;
  redactionBoundingBoxes: RedactionBoundingBox[];
  onAddBoundingBox: (box: ManualRedactionBoundingBox) => unknown;
  onDeleteBoundingBox: (box: RedactionBoundingBox) => unknown;
  onToggleBoundingBox: (box: RedactionBoundingBox) => unknown;
  scrollToBox: RedactionBoundingBox | null;
}

/**
 * Placeholder document pane until task 2.12 lands the real preview.
 * Exposes an add control so 2.6 can test optimistic box mutations.
 */
const RedactionPreview: React.FunctionComponent<RedactionPreviewProps> =
  React.memo(function RedactionPreview(props: RedactionPreviewProps) {
    const {
      redactionKey,
      pageCount,
      redactionBoundingBoxes,
      onAddBoundingBox,
      // Delete/toggle land with the real preview; required now so Inner's
      // contract does not change when that task ships.
      onDeleteBoundingBox: _onDeleteBoundingBox,
      onToggleBoundingBox: _onToggleBoundingBox,
      scrollToBox,
    } = props;
    const highlightedLabel = getHighlightedBoxLabel(scrollToBox);

    const handleAddBoundingBox = useMemoizedCallback(() => {
      const box: ManualRedactionBoundingBox = {
        type: 'manual',
        page: 1,
        enabled: true,
        box: {
          minX: 0.15,
          minY: 0.15,
          maxX: 0.35,
          maxY: 0.25,
        },
      };
      onAddBoundingBox(box);
    }, [onAddBoundingBox]);

    return (
      <Stack
        gap="md"
        data-testid={_redactionPreviewTestId}
        aria-label={`Preview for ${redactionKey}`}
      >
        <Text>
          {pageCount} {pageCount === 1 ? 'page' : 'pages'} ·{' '}
          {redactionBoundingBoxes.length} redactions
        </Text>
        {highlightedLabel ? <Text>Highlighted: {highlightedLabel}</Text> : null}
        <Button
          keyboardShortcut={null}
          onClick={handleAddBoundingBox}
          data-testid={_addManualBoxTestId}
        >
          Add drawn region
        </Button>
      </Stack>
    );
  });

export default RedactionPreview;

/** Test ID for the preview pane. Exported for tests. */
export const _redactionPreviewTestId = 'redaction-preview';

/** Test ID for the shim control that draws a manual box. Exported for tests. */
export const _addManualBoxTestId = 'redaction-preview-add-box';

function getHighlightedBoxLabel(
  scrollToBox: RedactionBoundingBox | null
): string | null {
  if (!scrollToBox) {
    return null;
  }
  return getRedactionBoxLabel(scrollToBox);
}
