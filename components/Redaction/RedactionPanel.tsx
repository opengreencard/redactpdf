'use client';

import React from 'react';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Alert, Anchor, ScrollArea, Stack, Text, Title } from '@mantine/core';
import type { NotificationData } from '@mantine/notifications';
import { notifications } from '@mantine/notifications';
import Button from '../designSystem/Button/Button';
import { useAPICall } from '../../lib/hookUtilities/useAPICall';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import {
  GenerateRedactedPDFClientRequest,
  generateRedactedPDFClient,
} from '../clientLib/api/redaction';
import { downloadArrayBufferAsFile } from '../clientLib/downloadArrayBufferAsFile';
import type { RedactedGetRedactionResponse } from '../../app/api/redaction/[key]/getRedaction';
import type { RequiredWithUndefined } from '../../lib/typescript/requiredWithUndefined';
import type { ButtonSection } from '../designSystem/Button/ButtonLeftOrRightSection';
import rules from '../designSystem/Rule.module.css';
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
      useMemoizedCallback(
        async ({ key }: GenerateRedactedPDFClientRequest): Promise<void> => {
          const arrayBuffer = await generateRedactedPDFClient({
            key,
          });
          downloadArrayBufferAsFile({
            arrayBuffer,
            contentType: 'application/pdf',
            fileName: 'redacted.pdf',
          });
        },
        []
      )
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
      <Stack gap={0} mih={0} h="100%" data-testid={_redactionPanelTestId}>
        <Stack gap="md" px="md" pt="lg" pb="md" className={rules.bottom}>
          <Title order={2} size="h3">
            Redacted information
          </Title>
          <Button
            keyboardShortcut={null}
            onClick={handleDownload}
            loading={isDownloadPending}
            // w="100%" rather than fullWidth: fullWidth pins the icon to the
            // left edge, but we want it beside the centered label.
            w="100%"
            size="md"
            leftSection={downloadIconSection}
            data-testid={_downloadButtonTestId}
          >
            Download
          </Button>
        </Stack>
        <ScrollArea
          flex={1}
          mih={0}
          type="auto"
          // Mantine renders the content as display: table, which sizes to the
          // longest unbroken label and ignores the truncate on each row. Use
          // block so rows take the panel width and long labels ellipsize.
          styles={{ content: { display: 'block' } }}
        >
          <Stack gap="sm" px="md" pt="md" pb="lg">
            {redaction.redactionBoundingBoxes.length === 0 ? (
              <Alert color="gray" title="No automatic redactions found">
                We could not find any automatic parts to redact. Please redact
                the document manually. You can also email us at{' '}
                <Anchor href="mailto:support@redactpdf.ai" inherit>
                  support@redactpdf.ai
                </Anchor>{' '}
                with the document, and we can try to improve the tool.
              </Alert>
            ) : (
              <>
                <Text size="sm" c="gray.7" px="sm">
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

const downloadIconSection: ButtonSection = { type: 'icon', icon: faDownload };
