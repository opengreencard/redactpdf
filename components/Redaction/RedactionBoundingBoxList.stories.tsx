import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Stack } from '@mantine/core';
import {
  RedactedDataType,
  type RedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import ClientFakeData from '../../lib/testUtilities/ClientFakeData';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { makeFakeHandler } from '../../lib/storybook';
import {
  removeBoundingBoxesFromArray,
  toggleBoundingBoxesInArray,
} from './redactionBoundingBoxes';
import RedactionBoundingBoxList, {
  RedactionBoundingBoxListProps,
} from './RedactionBoundingBoxList';

interface StoryWrapperProps {
  initialBoxes: RedactionBoundingBox[];
  onRedactionClick: (box: RedactionBoundingBox) => unknown;
}

const defaultProps: StoryWrapperProps = {
  initialBoxes: [
    ClientFakeData.makeAutoRedactionBoundingBox({
      dataType: RedactedDataType.email,
      text: 'peter@example.com',
    }),
    ClientFakeData.makeAutoRedactionBoundingBox({
      dataType: RedactedDataType.personName,
      text: 'Jane Doe',
      page: 2,
    }),
    ClientFakeData.makeManualRedactionBoundingBox({ page: 3 }),
  ],
  onRedactionClick: makeFakeHandler('onRedactionClick'),
};

const metadata: Meta = {
  title: 'RedactionBoundingBoxList',
  component: RedactionBoundingBoxList,
  args: defaultProps,
};
export default metadata;

/**
 * Owns list state so Storybook can exercise the same bulk callbacks that the
 * review page will provide after the mutation endpoints are implemented.
 */
const StoryWrapper: React.FunctionComponent<StoryWrapperProps> = React.memo(
  function StoryWrapper(props: StoryWrapperProps) {
    const { initialBoxes, onRedactionClick } = props;
    const [boxes, setBoxes] = useState<RedactionBoundingBox[]>(initialBoxes);

    const handleDelete = useMemoizedCallback(
      (boxesToDelete: RedactionBoundingBox[]) => {
        setBoxes((current) =>
          removeBoundingBoxesFromArray(current, boxesToDelete)
        );
      },
      []
    );
    const handleToggle = useMemoizedCallback(
      (boxesToToggle: RedactionBoundingBox[]) => {
        setBoxes((current) =>
          toggleBoundingBoxesInArray(current, boxesToToggle)
        );
      },
      []
    );
    const listProps: RedactionBoundingBoxListProps = {
      redactionBoundingBoxes: boxes,
      onRedactionClick,
      onDeleteBoundingBoxes: handleDelete,
      onToggleBoundingBoxes: handleToggle,
    };

    return (
      <Stack p="md">
        <RedactionBoundingBoxList {...listProps} />
      </Stack>
    );
  }
);

const Template: StoryFn<StoryWrapperProps> = (args) => (
  <StoryWrapper {...args} />
);

export const Default: StoryFn<StoryWrapperProps> = Template.bind({});

export const RepeatedValue: StoryFn<StoryWrapperProps> = Template.bind({});
RepeatedValue.args = {
  initialBoxes: [
    ClientFakeData.makeAutoRedactionBoundingBox({
      dataType: RedactedDataType.personName,
      text: 'Jane Doe',
      page: 1,
    }),
    ClientFakeData.makeAutoRedactionBoundingBox({
      dataType: RedactedDataType.personName,
      text: 'Jane Doe',
      page: 2,
      box: ClientFakeData.makeBoundingBox({ minY: 0.4, maxY: 0.5 }),
    }),
    ClientFakeData.makeAutoRedactionBoundingBox({
      dataType: RedactedDataType.personName,
      text: 'Jane Doe',
      page: 2,
      box: ClientFakeData.makeBoundingBox({ minY: 0.6, maxY: 0.7 }),
    }),
  ],
};

export const WithDisabledBox: StoryFn<StoryWrapperProps> = Template.bind({});
WithDisabledBox.args = {
  initialBoxes: [
    ClientFakeData.makeAutoRedactionBoundingBox({
      dataType: RedactedDataType.address,
      text: '123 Main Street',
      enabled: false,
    }),
    ClientFakeData.makeManualRedactionBoundingBox({
      page: 2,
      enabled: false,
    }),
  ],
};

export const ManualOnly: StoryFn<StoryWrapperProps> = Template.bind({});
ManualOnly.args = {
  initialBoxes: [
    ClientFakeData.makeManualRedactionBoundingBox({ page: 1 }),
    ClientFakeData.makeManualRedactionBoundingBox({
      page: 2,
      box: ClientFakeData.makeBoundingBox({ minX: 0.5, maxX: 0.8 }),
    }),
  ],
};

export const Empty: StoryFn<StoryWrapperProps> = Template.bind({});
Empty.args = {
  initialBoxes: [],
};
