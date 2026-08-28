import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import type { GetRedactionResponse } from '../../lib/models/redactionTypes';
import { estimatedMsPerPage } from '../../lib/redaction/estimatedMsPerPage';
import RedactionProgress, { RedactionProgressProps } from './RedactionProgress';

interface RedactionProgressStoryProps {
  redaction: Pick<GetRedactionResponse, 'pageCount'>;
  overrideEstimatedMsPerPage: number | undefined;
  // Use an offset so each story starts relative to the current time instead
  // of relying on a fixed `createdAt` that would become stale.
  createdAtOffsetMs: number;
}

const defaultProps: RedactionProgressStoryProps = {
  redaction: {
    pageCount: 1,
  },
  overrideEstimatedMsPerPage: undefined,
  createdAtOffsetMs: 0,
};

const metadata: Meta = {
  title: 'RedactionProgress',
  component: RedactionProgress,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<RedactionProgressStoryProps> = (args) => {
  const { redaction, overrideEstimatedMsPerPage, createdAtOffsetMs } = args;
  // Stories need a moving start time so the progress bar represents elapsed
  // time when viewed, while the control remains easy to set in milliseconds.
  // Capture it once so Storybook rerenders do not unexpectedly reset progress.
  const [createdAt] = useState<string>(() =>
    new Date(Date.now() - createdAtOffsetMs).toISOString()
  );
  const props: RedactionProgressProps = {
    redaction: {
      ...redaction,
      createdAt,
    },
    overrideEstimatedMsPerPage,
  };

  return <RedactionProgress {...props} />;
};

export const OnePage: StoryFn<RedactionProgressStoryProps> = Template.bind({});

export const ManyPages: StoryFn<RedactionProgressStoryProps> = Template.bind(
  {}
);
ManyPages.args = {
  redaction: {
    pageCount: 20,
  },
  overrideEstimatedMsPerPage: estimatedMsPerPage,
  createdAtOffsetMs: estimatedMsPerPage * 10,
};
