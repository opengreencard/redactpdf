import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Stack, Text } from '@mantine/core';
import { useConvertSingleArgumentToArray } from '../../lib/hookUtilities/useConvertSingleArgumentToArray';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { makeFakeHandler } from '../../lib/storybook';
import type {
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import RedactionPreviewPages, {
  RedactionPreviewPagesProps,
} from './RedactionPreviewPages';
import {
  removeBoundingBoxesFromArray,
  toggleBoundingBoxesInArray,
} from './redactionBoundingBoxes';
import {
  getStorybookRedactionImageUrl,
  makeStorybookRedactedResponse,
  storybookPreviewRedactionBoundingBoxes,
} from './redactionPreviewStorybookCommon';

const scrolledPageHandler = makeFakeHandler('onScrolledPageChange');
const containerReadyHandler = makeFakeHandler('onContainerReady');

const defaultProps: RedactionPreviewPagesProps = {
  redactionKey: 'storybook-key',
  redactionResponse: makeStorybookRedactedResponse(),
  onScrolledPageChange: scrolledPageHandler,
  onContainerReady: containerReadyHandler,
  zoomPercent: 42,
  onRedact: null,
  onDeleteBoundingBox: makeFakeHandler('onDeleteBoundingBox'),
  onToggleBoundingBox: makeFakeHandler('onToggleBoundingBox'),
  getUrlForRedactionImageForTesting: getStorybookRedactionImageUrl,
};

const metadata: Meta = {
  title: 'RedactionPreviewPages',
  component: RedactionPreviewPages,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<RedactionPreviewPagesProps> = (args) => (
  <Stack h="80vh">
    <RedactionPreviewPages {...args} />
  </Stack>
);

export const Default: StoryFn<RedactionPreviewPagesProps> = Template.bind({});

interface DrawModeStoryProps {
  initialBoxes: RedactionBoundingBox[];
  zoomPercent: number;
}

const DrawModeTemplate: StoryFn<DrawModeStoryProps> = (args) => {
  const { initialBoxes, zoomPercent } = args;
  const [boxes, setBoxes] = useState(initialBoxes);
  const handleRedact = useMemoizedCallback(
    (box: ManualRedactionBoundingBox): void => {
      setBoxes((current) => [...current, box]);
    },
    []
  );
  const handleDelete = useMemoizedCallback(
    (boxesToDelete: RedactionBoundingBox[]): void => {
      setBoxes((current) =>
        removeBoundingBoxesFromArray(current, boxesToDelete)
      );
    },
    []
  );
  const handleToggle = useMemoizedCallback(
    (boxesToToggle: RedactionBoundingBox[]): void => {
      setBoxes((current) => toggleBoundingBoxesInArray(current, boxesToToggle));
    },
    []
  );
  const onDeleteBoundingBox = useConvertSingleArgumentToArray(handleDelete);
  const onToggleBoundingBox = useConvertSingleArgumentToArray(handleToggle);
  return (
    <Stack h="80vh">
      <Text>Draw a rectangle on a page to add a manual redaction.</Text>
      <RedactionPreviewPages
        redactionKey="storybook-key"
        redactionResponse={makeStorybookRedactedResponse({
          redactionBoundingBoxes: boxes,
        })}
        onScrolledPageChange={scrolledPageHandler}
        onContainerReady={containerReadyHandler}
        zoomPercent={zoomPercent}
        onRedact={handleRedact}
        onDeleteBoundingBox={onDeleteBoundingBox}
        onToggleBoundingBox={onToggleBoundingBox}
        getUrlForRedactionImageForTesting={getStorybookRedactionImageUrl}
      />
    </Stack>
  );
};

export const DrawMode: StoryFn<DrawModeStoryProps> = DrawModeTemplate.bind({});
DrawMode.args = {
  initialBoxes: storybookPreviewRedactionBoundingBoxes,
  zoomPercent: 42,
};
