'use client';

import React, { useEffect, useRef } from 'react';
import type { NotificationData } from '@mantine/notifications';
import { notifications } from '@mantine/notifications';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useAPICall } from '../../lib/hookUtilities/useAPICall';
import { useInterval } from '../../lib/hookUtilities/useInterval';
import {
  getRedactionClient,
  mutateRedactionBoundingBoxesClient,
  touchRedactionOpenedAtClient,
} from '../clientLib/api/redaction';
import {
  RedactionBoundingBoxMutation,
  RedactionBoundingBoxMutationOp,
} from '../../lib/redaction/redactionBoundingBoxMutation';
import { APICallState } from '../../lib/typescript/apiCallState';
import type {
  GetRedactionResponse,
  RedactedGetRedactionResponse,
} from '../../app/api/redaction/[key]/getRedaction';
import {
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
  RedactionStatus,
} from '../../lib/redaction/redactionTypes';
import {
  addBoundingBoxesToResponse,
  removeBoundingBoxesFromResponse,
  setBoundingBoxesEnabledInResponse,
} from './redactionBoundingBoxes';
import RedactionPageInner from './RedactionPageInner';

export interface RedactionPageProps {
  /** Which redaction this page is reviewing. */
  redactionKey: string;
  isLoggedIn: boolean;
}

/**
 * Review page for one uploaded PDF. We poll until analysis finishes, ping
 * openedAt so idle cleanup doesn't delete a tab that's still open, then
 * save box edits with an optimistic UI.
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

    // Keep the document out of idle cleanup while this tab is open.
    // useInterval does not fire on mount, so ping once immediately.
    useEffect(() => {
      // Fire-and-forget: a failed ping is retried on the next interval tick.
      // eslint-disable-next-line no-void
      void touchRedactionOpenedAtClient({ key: redactionKey });
    }, [redactionKey]);

    // Once a minute is often enough vs the idle TTL, and cheap.
    // Keep in sync with the "once a minute" note on `touchRedactionOpenedAt`.
    useInterval(() => {
      // Fire-and-forget: a failed ping is retried on the next interval tick.
      // eslint-disable-next-line no-void
      void touchRedactionOpenedAtClient({ key: redactionKey });
    }, 60 * 1000);

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
          // Success has nothing new to show — we already applied the same
          // edits locally.
          await mutateRedactionBoundingBoxesClient({
            key: redactionKey,
            mutations,
          });
        } catch (err) {
          // Roll back immediately, then reconcile with the server because a
          // later in-flight request may have saved newer edits.
          setStateResult(previous);
          const refreshedState = await fetchRedaction({ key: redactionKey });
          const refreshed = getRedactedResult(refreshedState);
          if (refreshed) {
            setStateResult(refreshed);
          }
          const notification: NotificationData = {
            color: 'red',
            title: 'Could not update redactions',
            message: getErrorMessage(err),
            'data-testid': _mutationErrorNotificationTestId,
          };
          notifications.show(notification);
        }
      },
      [fetchRedaction, redactionKey, redactionState, setStateResult]
    );

    const handleAddBoundingBox = useMemoizedCallback(
      async (box: ManualRedactionBoundingBox) => {
        const mutation: RedactionBoundingBoxMutation = {
          op: RedactionBoundingBoxMutationOp.add,
          page: box.page,
          box: box.box,
        };
        await persistBoxMutation(
          (current) => addBoundingBoxesToResponse(current, [box]),
          [mutation]
        );
      },
      [persistBoxMutation]
    );

    const handleDeleteBoundingBoxes = useMemoizedCallback(
      async (boxes: RedactionBoundingBox[]) => {
        await persistBoxMutation(
          (current) => removeBoundingBoxesFromResponse(current, boxes),
          boxes.map((box): RedactionBoundingBoxMutation => ({
            op: RedactionBoundingBoxMutationOp.delete,
            page: box.page,
            box: box.box,
            type: box.type,
          }))
        );
      },
      [persistBoxMutation]
    );

    const handleBoundingBoxesEnabledChange = useMemoizedCallback(
      async (boxes: RedactionBoundingBox[], enabled: boolean) => {
        await persistBoxMutation(
          (current) =>
            setBoundingBoxesEnabledInResponse({ current, boxes, enabled }),
          boxes.map((box): RedactionBoundingBoxMutation => ({
            op: RedactionBoundingBoxMutationOp.setEnabled,
            page: box.page,
            box: box.box,
            type: box.type,
            enabled,
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
