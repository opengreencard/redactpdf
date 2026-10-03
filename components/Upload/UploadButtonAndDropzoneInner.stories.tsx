import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Container } from '@mantine/core';
import {
  APICallState,
  makeDoneState,
  makeErrorState,
  makeInProgressState,
} from '../../lib/typescript/apiCallState';
import type { UploadFileForRedactionResponse } from '../../app/api/redaction/uploadFileForRedaction';
import { delay } from '../../lib/utilities/delay';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import UploadButtonAndDropzoneInner from './UploadButtonAndDropzoneInner';

interface StoryWrapperProps {
  enableFullScreenDrop: boolean;
  initialUploadStatus: APICallState<UploadFileForRedactionResponse> | null;
}

const defaultProps: StoryWrapperProps = {
  enableFullScreenDrop: true,
  initialUploadStatus: null,
};

const metadata: Meta = {
  title: 'UploadButtonAndDropzoneInner',
  component: UploadButtonAndDropzoneInner,
  args: defaultProps,
};
export default metadata;

const simulatedUploadDurationMs = 5000;

/**
 * Owns dropzone API-call state so Storybook can exercise loading after a
 * real drop, the same Inner/wrapper split used in itineraries stories.
 */
const StoryWrapper: React.FunctionComponent<StoryWrapperProps> = React.memo(
  function StoryWrapper(props: StoryWrapperProps) {
    const { enableFullScreenDrop, initialUploadStatus } = props;
    const [uploadStatus, setUploadStatus] =
      useState<APICallState<UploadFileForRedactionResponse> | null>(
        initialUploadStatus
      );

    const handleFileSelected = useMemoizedCallback(async (_file: File) => {
      setUploadStatus(makeInProgressState());
      await delay(simulatedUploadDurationMs);
      const result: UploadFileForRedactionResponse = {
        key: 'storybook-key',
        pageCount: 1,
      };
      setUploadStatus(makeDoneState(result));
    }, []);

    return (
      <Container size={480} py="xl">
        <UploadButtonAndDropzoneInner
          enableFullScreenDrop={enableFullScreenDrop}
          onFileSelected={handleFileSelected}
          uploadStatus={uploadStatus}
        />
      </Container>
    );
  }
);

const Template: StoryFn<StoryWrapperProps> = (args) => (
  <StoryWrapper {...args} />
);

export const Default: StoryFn<StoryWrapperProps> = Template.bind({});

export const Loading: StoryFn<StoryWrapperProps> = Template.bind({});
Loading.args = {
  initialUploadStatus: makeInProgressState(),
};

export const Error: StoryFn<StoryWrapperProps> = Template.bind({});
Error.args = {
  initialUploadStatus: makeErrorState('The PDF could not be uploaded.'),
};
