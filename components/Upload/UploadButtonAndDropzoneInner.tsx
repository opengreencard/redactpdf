'use client';

import React, { useState } from 'react';
import { Box, Stack, Text } from '@mantine/core';
import {
  Dropzone,
  DropzoneAccept,
  DropzoneIdle,
  DropzoneReject,
  MIME_TYPES,
} from '@mantine/dropzone';
import type { FileRejection } from '@mantine/dropzone';
import { ErrorCode } from 'react-dropzone';
import {
  faCircleXmark,
  faCloudArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import Button from '../designSystem/Button/Button';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { APICallState } from '../../lib/typescript/apiCallState';
import { getUnreachableError } from '../../lib/typescript/getUnreachableError';
import type { UploadFileForRedactionResponse } from '../../app/api/redaction/uploadFileForRedaction';
import classes from './UploadButtonAndDropzone.module.css';

export interface UploadButtonAndDropzoneInnerProps {
  onFileSelected: (file: File) => unknown;
  uploadStatus: APICallState<UploadFileForRedactionResponse> | null;
  /**
   * When true, dragging a file anywhere over the window opens a fullscreen
   * drop overlay. Only one instance on a page should enable this so two
   * overlays do not both handle the same drop.
   */
  enableFullScreenDrop: boolean;
}

/** Test ID for the hidden file input. Exported for tests. */
export const _uploadPDFInputTestId = 'upload-pdf-input';

/** Test ID for drop-rejection or upload API error text. Exported for tests. */
export const _uploadErrorMessageTestId = 'upload-error-message';

/**
 * Presentational PDF dropzone. Mantine Dropzone still delivers `File[]`; this
 * component takes the first file and calls `onFileSelected` so callers only
 * ever handle one PDF (picker and drag/drop share that path).
 *
 * `DropzoneIdle` / `DropzoneAccept` / `DropzoneReject` are drag-preview
 * children: Idle is the resting cloud icon, Accept tints it when a PDF is
 * dragged over, and Reject shows an X for a non-PDF or multiple files.
 * They reset when the drag ends. After an invalid drop, a specific error
 * message stays visible. Loading and API errors come from `uploadStatus`.
 */
const UploadButtonAndDropzoneInner: React.FunctionComponent<UploadButtonAndDropzoneInnerProps> =
  React.memo(function UploadButtonAndDropzoneInner(
    props: UploadButtonAndDropzoneInnerProps
  ) {
    const { onFileSelected, uploadStatus, enableFullScreenDrop } = props;
    const isUploading = uploadStatus?.status === 'inProgress';
    const [rejectionMessage, setRejectionMessage] = useState<string | null>(
      null
    );
    const fileInputProps: React.InputHTMLAttributes<HTMLInputElement> & {
      'data-testid': string;
    } = {
      'aria-label': 'Upload a PDF',
      'data-testid': _uploadPDFInputTestId,
    };

    const handleDrop = useMemoizedCallback(
      (files: File[]) => {
        const file = files[0];
        if (!file) {
          return;
        }
        setRejectionMessage(null);
        onFileSelected(file);
      },
      [onFileSelected]
    );
    const handleReject = useMemoizedCallback((rejections: FileRejection[]) => {
      setRejectionMessage(_getDropRejectionMessage(rejections));
    }, []);

    const errorMessage =
      uploadStatus?.status === 'error' ? uploadStatus.error : rejectionMessage;

    return (
      <>
        <Dropzone
          {...dropzoneFileConstraints}
          onDrop={handleDrop}
          onReject={handleReject}
          loading={isUploading}
          classNames={{ root: classes.root }}
          inputProps={fileInputProps}
          p="xl"
        >
          <DropzoneContents errorMessage={errorMessage} />
        </Dropzone>
        {enableFullScreenDrop && (
          <Dropzone.FullScreen
            {...dropzoneFileConstraints}
            onDrop={handleDrop}
            onReject={handleReject}
            active={!isUploading}
          >
            <FullScreenDropContents />
          </Dropzone.FullScreen>
        )}
      </>
    );
  });

export default UploadButtonAndDropzoneInner;

const dropzoneFileConstraints: {
  accept: string[];
  maxFiles: number;
  multiple: boolean;
} = {
  accept: [MIME_TYPES.pdf],
  maxFiles: 1,
  multiple: false,
};

interface DropzoneContentsProps {
  errorMessage: string | null;
}

const DropzoneContents: React.FunctionComponent<DropzoneContentsProps> =
  React.memo(function DropzoneContents(props: DropzoneContentsProps) {
    const { errorMessage } = props;

    return (
      <Stack align="center" gap="sm" py="md">
        <DropzoneStatusIcons />
        <Button keyboardShortcut={null} onClick={null}>
          + Select file
        </Button>
        <Text size="sm" c="dimmed">
          PDF only
        </Text>
        {errorMessage && (
          <Text c="red" size="sm" data-testid={_uploadErrorMessageTestId}>
            {errorMessage}
          </Text>
        )}
      </Stack>
    );
  });

const FullScreenDropContents: React.FunctionComponent = React.memo(
  function FullScreenDropContents() {
    return (
      <Stack align="center" gap="sm" py="md">
        <DropzoneStatusIcons />
        <Text fw="bold">Drop a PDF here</Text>
        <Text size="sm" c="dimmed">
          PDF only
        </Text>
      </Stack>
    );
  }
);

const DropzoneStatusIcons: React.FunctionComponent = React.memo(
  function DropzoneStatusIcons() {
    return (
      <Box>
        <DropzoneIdle>
          <Box c="green.8">
            <FontAwesomeIcon icon={faCloudArrowUp} size="2x" />
          </Box>
        </DropzoneIdle>
        <DropzoneAccept>
          <Box c="green.8">
            <FontAwesomeIcon icon={faCloudArrowUp} size="2x" />
          </Box>
        </DropzoneAccept>
        <DropzoneReject>
          <Box c="red.6">
            <FontAwesomeIcon icon={faCircleXmark} size="2x" />
          </Box>
        </DropzoneReject>
      </Box>
    );
  }
);

/** Maps Dropzone rejections to a user-facing message. Exported for tests. */
export function _getDropRejectionMessage(rejections: FileRejection[]): string {
  const rejection = rejections[0];
  if (!rejection) {
    return 'This file could not be uploaded.';
  }

  const error = rejection.errors[0];
  if (!error) {
    return `${rejection.file.name} could not be uploaded.`;
  }

  if (!isDropzoneErrorCode(error.code)) {
    return `${rejection.file.name} could not be uploaded.`;
  }

  switch (error.code) {
    case ErrorCode.FileInvalidType:
      return `${rejection.file.name} is not a PDF. Please upload a PDF.`;
    case ErrorCode.TooManyFiles:
      return 'Please drop one PDF at a time.';
    case ErrorCode.FileTooLarge:
      return `${rejection.file.name} is too large.`;
    case ErrorCode.FileTooSmall:
      return `${rejection.file.name} is too small.`;
    default:
      throw getUnreachableError(error.code);
  }
}

function isDropzoneErrorCode(code: string): code is ErrorCode {
  return Object.values(ErrorCode).some((errorCode) => errorCode === code);
}
