'use client';

import React from 'react';
import { ActionIcon, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import type { NotificationData } from '@mantine/notifications';
import { notifications } from '@mantine/notifications';
import { faEye, faEyeSlash, faXmark } from '@fortawesome/free-solid-svg-icons';
import Button from '../designSystem/Button/Button';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import { useAPICall } from '../../lib/hookUtilities/useAPICall';
import { useCallbackWithPrefix } from '../../lib/hookUtilities/useCallbackWithPrefix';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { generateRedactedPDFClient } from '../clientLib/api/redaction';
import type {
  GetRedactionResponse,
  RedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import { getRedactionBoxLabel } from './redactionBoundingBoxes';

export interface RedactionPanelProps {
  redactionKey: string;
  redaction: GetRedactionResponse;
  onRedactionClick: (box: RedactionBoundingBox) => unknown;
  onDeleteBoundingBox: (box: RedactionBoundingBox) => unknown;
  onToggleBoundingBox: (box: RedactionBoundingBox) => unknown;
}

/**
 * Left-rail list of detections. Flat until task 2.11 groups by `dataType`.
 */
const RedactionPanel: React.FunctionComponent<RedactionPanelProps> = React.memo(
  function RedactionPanel(props: RedactionPanelProps) {
    const {
      redactionKey,
      redaction,
      onRedactionClick,
      onDeleteBoundingBox,
      onToggleBoundingBox,
    } = props;
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

    const onRedactionClickWithPrefix =
      useCallbackWithPrefix<[RedactionBoundingBox]>(onRedactionClick);
    const onDeleteWithPrefix =
      useCallbackWithPrefix<[RedactionBoundingBox]>(onDeleteBoundingBox);
    const handleIsEnabledChange = useMemoizedCallback(
      (box: RedactionBoundingBox, isEnabled: boolean) => {
        if (box.enabled === isEnabled) {
          return;
        }
        onToggleBoundingBox(box);
      },
      [onToggleBoundingBox]
    );
    const onIsEnabledChangeWithPrefix = useCallbackWithPrefix<
      [RedactionBoundingBox],
      [boolean]
    >(handleIsEnabledChange);

    return (
      <Stack gap="md" data-testid={_redactionPanelTestId}>
        <Button
          keyboardShortcut={null}
          onClick={handleDownload}
          loading={isDownloadPending}
          data-testid={_downloadButtonTestId}
        >
          Download
        </Button>
        <Text>Review suggestions and hide or remove any you do not need.</Text>
        <Stack gap="xs">
          {redaction.redactionBoundingBoxes.map((box, index) => (
            <RedactionPanelRow
              key={getRedactionBoxKey(box, index)}
              box={box}
              index={index}
              onRedactionClick={onRedactionClickWithPrefix(box)}
              onDelete={onDeleteWithPrefix(box)}
              onIsEnabledChange={onIsEnabledChangeWithPrefix(box)}
            />
          ))}
        </Stack>
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

/** Test ID prefix for a suggestion row. Exported for tests. */
export const _redactionPanelRowTestId = 'redaction-panel-row';

/** Test ID prefix for a row's eye toggle. Exported for tests. */
export const _redactionPanelToggleTestId = 'redaction-panel-toggle';

/** Test ID prefix for a row's delete control. Exported for tests. */
export const _redactionPanelDeleteTestId = 'redaction-panel-delete';

interface RedactionPanelRowBoundProps {
  box: RedactionBoundingBox;
  index: number;
  onRedactionClick: () => unknown;
  onDelete: () => unknown;
  onIsEnabledChange: (isEnabled: boolean) => unknown;
}

const RedactionPanelRow: React.FunctionComponent<RedactionPanelRowBoundProps> =
  React.memo(function RedactionPanelRow(props: RedactionPanelRowBoundProps) {
    const { box, index, onRedactionClick, onDelete, onIsEnabledChange } = props;
    const label = getRedactionBoxLabel(box);
    const onIsEnabledChangeWithPrefix =
      useCallbackWithPrefix<[boolean]>(onIsEnabledChange);

    return (
      <Group
        justify="space-between"
        wrap="nowrap"
        data-testid={`${_redactionPanelRowTestId}-${index}`}
      >
        <UnstyledButton onClick={onRedactionClick} ta="left">
          <Text
            td={box.enabled ? undefined : 'line-through'}
            c={box.enabled ? undefined : 'dimmed'}
          >
            {label}
          </Text>
        </UnstyledButton>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            aria-label={box.enabled ? 'Hide redaction' : 'Show redaction'}
            onClick={onIsEnabledChangeWithPrefix(!box.enabled)}
            data-testid={`${_redactionPanelToggleTestId}-${index}`}
          >
            <FontAwesomeIcon icon={box.enabled ? faEye : faEyeSlash} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            aria-label="Delete redaction"
            onClick={onDelete}
            data-testid={`${_redactionPanelDeleteTestId}-${index}`}
          >
            <FontAwesomeIcon icon={faXmark} />
          </ActionIcon>
        </Group>
      </Group>
    );
  });

function getRedactionBoxKey(box: RedactionBoundingBox, index: number): string {
  return [
    box.type,
    box.page,
    box.box.minX,
    box.box.minY,
    box.box.maxX,
    box.box.maxY,
    index,
  ].join(':');
}
