import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Stack } from '@mantine/core';
import {
  RedactedDataType,
  type GetRedactionResponse,
  type RedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import ClientFakeData from '../../lib/testUtilities/ClientFakeData';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { makeFakeHandler } from '../../lib/storybook';
import {
  removeBoundingBoxesFromResponse,
  toggleBoundingBoxesInResponse,
} from './redactionBoundingBoxes';
import RedactionPanel, { RedactionPanelProps } from './RedactionPanel';

interface StoryWrapperProps {
  redactionKey: string;
  initialRedaction: GetRedactionResponse;
  onRedactionClick: (box: RedactionBoundingBox) => unknown;
}

const defaultProps: StoryWrapperProps = {
  redactionKey: 'storybook-key',
  initialRedaction: ClientFakeData.makeGetRedactionResponse({
    pageCount: 3,
    redactionBoundingBoxes: [
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.email,
        text: 'peter@example.com',
        page: 1,
      }),
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.email,
        text: 'peter@example.com',
        page: 2,
      }),
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.personName,
        text: 'Jane Doe',
        page: 1,
      }),
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.personName,
        text: 'Jane Doe',
        page: 2,
      }),
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.personName,
        text: 'Jane Doe',
        page: 2,
        box: ClientFakeData.makeBoundingBox({ minY: 0.5, maxY: 0.6 }),
      }),
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.phone,
        text: '(203) 675-5503',
        page: 1,
      }),
      ClientFakeData.makeAutoRedactionBoundingBox({
        dataType: RedactedDataType.phone,
        text: '22231024',
        page: 2,
      }),
      ClientFakeData.makeManualRedactionBoundingBox({ page: 3 }),
    ],
  }),
  onRedactionClick: makeFakeHandler('onRedactionClick'),
};

const metadata: Meta = {
  title: 'RedactionPanel',
  component: RedactionPanel,
  args: defaultProps,
};
export default metadata;

/**
 * Owns the response state so the panel story exercises grouped bulk actions.
 */
const StoryWrapper: React.FunctionComponent<StoryWrapperProps> = React.memo(
  function StoryWrapper(props: StoryWrapperProps) {
    const { redactionKey, initialRedaction, onRedactionClick } = props;
    const [redaction, setRedaction] =
      useState<GetRedactionResponse>(initialRedaction);

    const handleDelete = useMemoizedCallback(
      (boxes: RedactionBoundingBox[]) => {
        setRedaction((current) =>
          removeBoundingBoxesFromResponse(current, boxes)
        );
      },
      []
    );
    const handleToggle = useMemoizedCallback(
      (boxes: RedactionBoundingBox[]) => {
        setRedaction((current) =>
          toggleBoundingBoxesInResponse(current, boxes)
        );
      },
      []
    );
    const panelProps: RedactionPanelProps = {
      redactionKey,
      redaction,
      onRedactionClick,
      onDeleteBoundingBoxes: handleDelete,
      onToggleBoundingBoxes: handleToggle,
    };

    // Keep the story focused on the rail while preserving readable values.
    return (
      <Stack maw={420} p="md">
        <RedactionPanel {...panelProps} />
      </Stack>
    );
  }
);

const Template: StoryFn<StoryWrapperProps> = (args) => (
  <StoryWrapper {...args} />
);

export const Default: StoryFn<StoryWrapperProps> = Template.bind({});

export const Empty: StoryFn<StoryWrapperProps> = Template.bind({});
Empty.args = {
  initialRedaction: ClientFakeData.makeGetRedactionResponse({
    redactionBoundingBoxes: [],
  }),
};
