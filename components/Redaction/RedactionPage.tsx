'use client';

import React, { useEffect, useRef } from 'react';
import type { NotificationData } from '@mantine/notifications';
import { notifications } from '@mantine/notifications';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useAPICall } from '../../lib/hookUtilities/useAPICall';
import {
  getRedactionClient,
  mutateRedactionBoundingBoxesClient,
} from '../clientLib/api/redaction';
import type { RedactionBoundingBoxMutation } from '../../app/api/redaction/[key]/redacted/mutateRedactionBoundingBoxes';
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
        mutations: RedactionBoundingBoxMutation[]
      ) => {
        const previous = getRedactedResult(redactionState);
        if (!previous) {
          return;
        }

        const optimistic: RedactedGetRedactionResponse =
          applyOptimistic(previous);
        setStateResult(optimistic);

        try {
          setStateResult(
            await mutateRedactionBoundingBoxesClient({
              key: redactionKey,
              mutations,
            })
          );
        } catch (err) {
          // One POST applies the whole batch or none of it, so we can roll
          // back to the pre-click boxes.
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
      [redactionKey, redactionState, setStateResult]
    );

    const handleAddBoundingBox = useMemoizedCallback(
      async (box: ManualRedactionBoundingBox) => {
        await persistBoxMutation(
          (current) => addBoundingBoxesToResponse(current, [box]),
          [{ op: 'add', page: box.page, box: box.box }]
        );
      },
      [persistBoxMutation]
    );

    const handleDeleteBoundingBoxes = useMemoizedCallback(
      async (boxes: RedactionBoundingBox[]) => {
        await persistBoxMutation(
          (current) => removeBoundingBoxesFromResponse(current, boxes),
          boxes.map((box): RedactionBoundingBoxMutation => ({
            op: 'delete',
            page: box.page,
            box: box.box,
            type: box.type,
          }))
        );
      },
      [persistBoxMutation]
    );

    const handleBoundingBoxesEnabledChange = useMemoizedCallback(
      async (boxes: RedactionBoundingBox[]) => {
        await persistBoxMutation(
          (current) => toggleBoundingBoxesInResponse(current, boxes),
          boxes.map((box): RedactionBoundingBoxMutation => ({
            // Send the intended flag so a missed request cannot invert
            // the next click.
            op: 'setEnabled',
            page: box.page,
            box: box.box,
            type: box.type,
            enabled: !box.enabled,
          }))
        );
      },
      [persistBoxMutation]
    );

    return (
      <RedactionPageInner
        redactionKey={redactionKey}
        redactionState={redactionState}
        isLoggedIn={isLoggedIn}
        onAddBoundingBox={handleAddBoundingBox}
        onDeleteBoundingBoxes={handleDeleteBoundingBoxes}
        onEnabledChange={handleBoundingBoxesEnabledChange}
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
