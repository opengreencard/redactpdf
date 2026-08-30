'use client';

import React from 'react';
import { Alert, Anchor, ScrollArea, Stack, Text, Title } from '@mantine/core';
import type { NotificationData } from '@mantine/notifications';
import { notifications } from '@mantine/notifications';
import Button from '../designSystem/Button/Button';
import { useAPICall } from '../../lib/hookUtilities/useAPICall';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { generateRedactedPDFClient } from '../clientLib/api/redaction';
import type { RedactedGetRedactionResponse } from '../../lib/models/redactionTypes';
import type { RequiredWithUndefined } from '../../lib/typescript/requiredWithUndefined';
import RedactionBoundingBoxList, {
  RedactionBoundingBoxListProps,
} from './RedactionBoundingBoxList';

interface RedactionPanelOwnProps {
  redactionKey: string;
  redaction: RedactedGetRedactionResponse;
}

interface RedactionPanelPassThroughProps extends Omit<
  RedactionBoundingBoxListProps,
  'redactionBoundingBoxes'
> {}

export interface RedactionPanelProps
  extends RedactionPanelOwnProps, RedactionPanelPassThroughProps {}

/**
 * Left-rail list of detections and the repeatable PDF download action.
 */
const RedactionPanel: React.FunctionComponent<RedactionPanelProps> = React.memo(
  function RedactionPanel(props: RedactionPanelProps) {
    const { redactionKey, redaction, ...passThroughProps } = props;
    // Keep owned props explicit so new wrapper fields cannot silently become
    // pass-through props.
    const _ownProps: RequiredWithUndefined<RedactionPanelOwnProps> = {
      redactionKey,
      redaction,
    };
    const { call: startDownload, state: downloadState } = useAPICall(
      generateRedactedPDFClient
    );
    const isDownloadPending = downloadState?.status === 'inProgress';

    const handleDownload = useMemoizedCallback(async () => {
      const outcome = await startDownload({ key: redactionKey });
      if (outcome.status === 'error') {
        const notification: NotificationData = {
          color: 'red',
          title: 'Could not download PDF',
          message: outcome.error,
          'data-testid': _downloadErrorNotificationTestId,
        };
        notifications.show(notification);
      }
    }, [redactionKey, startDownload]);

    return (
      <Stack gap="md" mih={0} h="100%" data-testid={_redactionPanelTestId}>
        <Stack gap="md" px="md" pt="md">
          <Title order={2}>Redacted information</Title>
          <Button
            keyboardShortcut={null}
            onClick={handleDownload}
            loading={isDownloadPending}
            data-testid={_downloadButtonTestId}
          >
            Download
          </Button>
        </Stack>
        <ScrollArea flex={1} mih={0} type="auto">
          <Stack gap="md" px="md" pb="md">
            {redaction.redactionBoundingBoxes.length === 0 ? (
              <Alert color="blue" title="No automatic redactions found">
                We could not find any automatic parts to redact. Please redact
                the document manually. You can also email us at{' '}
                <Anchor href="mailto:support@redactpdf.ai" inherit>
                  support@redactpdf.ai
                </Anchor>{' '}
                with the document, and we can try to improve the tool.
              </Alert>
            ) : (
              <>
                <Text>
                  Review suggestions and hide or remove any you do not need.
                </Text>
                <RedactionBoundingBoxList
                  {...passThroughProps}
                  redactionBoundingBoxes={redaction.redactionBoundingBoxes}
                />
              </>
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    );
  }
);

export default RedactionPanel;

/** Test ID for the Download button. Exported for tests. */
export const _downloadButtonTestId = 'redaction-download-button';

/** Test ID for a failed download notification. Exported for tests. */
export const _downloadErrorNotificationTestId =
  'redaction-download-error-notification';

/** Test ID for the review suggestions rail. Exported for tests. */
export const _redactionPanelTestId = 'redaction-panel';
