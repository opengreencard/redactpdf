'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { NotificationData } from '@mantine/notifications';
import { notifications } from '@mantine/notifications';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useAPICall } from '../../lib/hookUtilities/useAPICall';
import {
  addRedactionBoundingBoxClient,
  deleteRedactionBoundingBoxClient,
  getRedactionClient,
  toggleRedactionBoundingBoxClient,
} from '../clientLib/api/redaction';
import { APICallState } from '../../lib/typescript/apiCallState';
import {
  GetRedactionResponse,
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
  RedactionStatus,
} from '../../lib/models/redactionTypes';
import {
  addBoundingBoxToResponse,
  removeBoundingBoxFromResponse,
  toggleBoundingBoxInResponse,
} from './redactionBoundingBoxes';
import RedactionPageInner from './RedactionPageInner';

export interface RedactionPageProps {
  redactionKey: string;
}

/**
 * Client container for `/redact/:key`. Polls getRedaction until the document
 * leaves `redacting`, then owns optimistic box edits.
 */
const RedactionPage: React.FunctionComponent<RedactionPageProps> = React.memo(
  function RedactionPage(props: RedactionPageProps) {
    const { redactionKey } = props;
    const [highlightedBox, setHighlightedBox] =
      useState<RedactionBoundingBox | null>(null);
    const startedKeyRef = useRef<string | null>(null);

    const {
      call: fetchRedaction,
      state: redactionState,
      setStateResult,
    } = useAPICall(getRedactionClient, {
      // Keep the last successful GET while polling or saving so a pending
      // mutation does not flash the analyzing view.
      keepResultWhileLoading: true,
      repeatUntil: (result: GetRedactionResponse) =>
        result.status !== RedactionStatus.redacting,
      repeatIntervalMs: 1000,
    });

    // useAPICall recreates `call` when the last result changes. Start once
    // per key so polling is not restarted on every successful poll tick.
    useEffect(() => {
      if (startedKeyRef.current === redactionKey) {
        return;
      }
      startedKeyRef.current = redactionKey;
      // Polling is fire-and-forget; the spec requires no cancellation.
      // eslint-disable-next-line no-void
      void fetchRedaction({ key: redactionKey });
    }, [fetchRedaction, redactionKey]);

    const persistBoxMutation = useMemoizedCallback(
      async (
        applyOptimistic: (
          current: GetRedactionResponse
        ) => GetRedactionResponse,
        persist: () => Promise<void>
      ) => {
        const previous = getRedactedResult(redactionState);
        if (!previous) {
          return;
        }

        const optimistic: GetRedactionResponse = applyOptimistic(previous);
        setStateResult(optimistic);

        try {
          await persist();
        } catch (err) {
          setStateResult(previous);
          const notification: NotificationData = {
            color: 'red',
            title: 'Could not update redactions',
            message: getErrorMessage(err),
            'data-testid': _mutationErrorNotificationTestId,
          };
          notifications.show(notification);
        }
      },
      [redactionState, setStateResult]
    );

    const handleAddBoundingBox = useMemoizedCallback(
      async (box: ManualRedactionBoundingBox) => {
        await persistBoxMutation(
          (current) => addBoundingBoxToResponse(current, box),
          () =>
            addRedactionBoundingBoxClient({
              key: redactionKey,
              page: box.page,
              bbox: box.box,
            })
        );
      },
      [persistBoxMutation, redactionKey]
    );

    const handleDeleteBoundingBox = useMemoizedCallback(
      async (box: RedactionBoundingBox) => {
        await persistBoxMutation(
          (current) => removeBoundingBoxFromResponse(current, box),
          () =>
            deleteRedactionBoundingBoxClient({
              key: redactionKey,
              page: box.page,
              box: box.box,
              type: box.type,
            })
        );
      },
      [persistBoxMutation, redactionKey]
    );

    const handleToggleBoundingBox = useMemoizedCallback(
      async (box: RedactionBoundingBox) => {
        await persistBoxMutation(
          (current) => toggleBoundingBoxInResponse(current, box),
          () =>
            toggleRedactionBoundingBoxClient({
              key: redactionKey,
              page: box.page,
              box: box.box,
              type: box.type,
            })
        );
      },
      [persistBoxMutation, redactionKey]
    );

    const handleRedactionClick = useMemoizedCallback(
      (box: RedactionBoundingBox) => {
        setHighlightedBox(box);
      },
      []
    );

    return (
      <RedactionPageInner
        redactionKey={redactionKey}
        redactionState={redactionState}
        onAddBoundingBox={handleAddBoundingBox}
        onDeleteBoundingBox={handleDeleteBoundingBox}
        onToggleBoundingBox={handleToggleBoundingBox}
        highlightedBox={highlightedBox}
        onRedactionClick={handleRedactionClick}
      />
    );
  }
);

export default RedactionPage;

/** Test ID for a failed box-mutation notification. Exported for tests. */
export const _mutationErrorNotificationTestId =
  'redaction-mutation-error-notification';

function getRedactedResult(
  redactionState: APICallState<GetRedactionResponse> | null
): GetRedactionResponse | null {
  return redactionState?.status === 'done'
    ? (redactionState.result ?? null)
    : null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}
