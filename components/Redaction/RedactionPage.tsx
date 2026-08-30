'use client';

import React, { useEffect, useRef } from 'react';
import type { NotificationData } from '@mantine/notifications';
import { notifications } from '@mantine/notifications';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useConvertSingleArgumentToArray } from '../../lib/hookUtilities/useConvertSingleArgumentToArray';
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
  RedactedGetRedactionResponse,
  RedactionBoundingBox,
  RedactionStatus,
} from '../../lib/models/redactionTypes';
import {
  addBoundingBoxesToResponse,
  removeBoundingBoxesFromResponse,
  toggleBoundingBoxesInResponse,
} from './redactionBoundingBoxes';
import RedactionPageInner from './RedactionPageInner';

export interface RedactionPageProps {
  redactionKey: string;
  isLoggedIn: boolean;
}

/**
 * Client container for `/redact/:key`. Polls getRedaction until the document
 * leaves `redacting`, then owns optimistic box edits.
 */
const RedactionPage: React.FunctionComponent<RedactionPageProps> = React.memo(
  function RedactionPage(props: RedactionPageProps) {
    const { redactionKey, isLoggedIn } = props;
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
          current: RedactedGetRedactionResponse
        ) => RedactedGetRedactionResponse,
        persist: () => Promise<void>
      ) => {
        const previous = getRedactedResult(redactionState);
        if (!previous) {
          return;
        }

        const optimistic: RedactedGetRedactionResponse =
          applyOptimistic(previous);
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

    const handleAddBoundingBoxes = useMemoizedCallback(
      async (boxes: ManualRedactionBoundingBox[]) => {
        await persistBoxMutation(
          (current) => addBoundingBoxesToResponse(current, boxes),
          () =>
            addRedactionBoundingBoxClient({
              key: redactionKey,
              boxes,
            })
        );
      },
      [persistBoxMutation, redactionKey]
    );

    const handleAddBoundingBox = useConvertSingleArgumentToArray(
      handleAddBoundingBoxes
    );

    const handleDeleteBoundingBoxes = useMemoizedCallback(
      async (boxes: RedactionBoundingBox[]) => {
        await persistBoxMutation(
          (current) => removeBoundingBoxesFromResponse(current, boxes),
          () =>
            deleteRedactionBoundingBoxClient({
              key: redactionKey,
              boxes,
            })
        );
      },
      [persistBoxMutation, redactionKey]
    );

    const handleToggleBoundingBoxes = useMemoizedCallback(
      async (boxes: RedactionBoundingBox[]) => {
        await persistBoxMutation(
          (current) => toggleBoundingBoxesInResponse(current, boxes),
          () =>
            toggleRedactionBoundingBoxClient({
              key: redactionKey,
              boxes,
            })
        );
      },
      [persistBoxMutation, redactionKey]
    );

    return (
      <RedactionPageInner
        redactionKey={redactionKey}
        redactionState={redactionState}
        isLoggedIn={isLoggedIn}
        onAddBoundingBox={handleAddBoundingBox}
        onDeleteBoundingBoxes={handleDeleteBoundingBoxes}
        onToggleBoundingBoxes={handleToggleBoundingBoxes}
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
): RedactedGetRedactionResponse | null {
  if (
    redactionState?.status === 'done' &&
    redactionState.result.status === RedactionStatus.redacted
  ) {
    return redactionState.result;
  }
  return null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}
