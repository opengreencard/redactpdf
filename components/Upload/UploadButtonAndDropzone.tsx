'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Stack, Text } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import Button from '../designSystem/Button/Button';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import classes from './UploadButtonAndDropzone.module.css';

/**
 * Shim until task 2.2. Looks like the real dropzone but does not upload;
 * any accepted PDF navigates to `/redact/shim-key`.
 */
const shimRedactionKey = 'shim-key';

const UploadButtonAndDropzone: React.FunctionComponent = React.memo(
  function UploadButtonAndDropzone() {
    const router = useRouter();
    const openRef = useRef<(() => void | undefined) | null>(null);

    const handleDrop = useMemoizedCallback(
      (files: File[]) => {
        if (files.length !== 1) {
          return;
        }
        router.push(`/redact/${shimRedactionKey}`);
      },
      [router]
    );
    const handleOpenPicker = useMemoizedCallback(() => {
      openRef.current?.();
    }, []);

    return (
      <Dropzone
        openRef={openRef}
        onDrop={handleDrop}
        accept={[MIME_TYPES.pdf]}
        maxFiles={1}
        multiple={false}
        classNames={{ root: classes.root }}
        p="xl"
      >
        <Stack align="center" gap="sm" py="md">
          <FontAwesomeIcon
            icon={faCloudArrowUp}
            size="2x"
            color="var(--mantine-primary-color-6)"
          />
          <Button keyboardShortcut={null} onClick={handleOpenPicker}>
            Select a PDF
          </Button>
          <Text size="sm" c="dimmed">
            or drop a file here · PDF only
          </Text>
        </Stack>
      </Dropzone>
    );
  }
);

export default UploadButtonAndDropzone;
