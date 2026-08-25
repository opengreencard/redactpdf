'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useAPICall } from '../../lib/hookUtilities/useAPICall';
import { uploadFileForRedactionClient } from '../clientLib/api/redaction';
import UploadButtonAndDropzoneInner from './UploadButtonAndDropzoneInner';

export interface UploadButtonAndDropzoneProps {
  enableFullScreenDrop: boolean;
}

/**
 * Uploads one PDF and navigates to `/redact/:key` when the API succeeds.
 */
const UploadButtonAndDropzone: React.FunctionComponent<UploadButtonAndDropzoneProps> =
  React.memo(function UploadButtonAndDropzone(
    props: UploadButtonAndDropzoneProps
  ) {
    const { enableFullScreenDrop } = props;
    const router = useRouter();

    const { call: handleFileSelected, state: uploadStatus } = useAPICall(
      useMemoizedCallback(
        async (file: File) => {
          const result = await uploadFileForRedactionClient({ file });
          router.push(`/redact/${result.key}`);
          return result;
        },
        [router]
      )
    );

    return (
      <UploadButtonAndDropzoneInner
        onFileSelected={handleFileSelected}
        uploadStatus={uploadStatus}
        enableFullScreenDrop={enableFullScreenDrop}
      />
    );
  });

export default UploadButtonAndDropzone;
