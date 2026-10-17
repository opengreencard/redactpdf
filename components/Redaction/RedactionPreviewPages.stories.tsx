import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Stack, Text } from '@mantine/core';
import { useConvertSingleArgumentToArray } from '../../lib/hookUtilities/useConvertSingleArgumentToArray';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { makeFakeHandler } from '../../lib/storybook';
import type {
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
} from '../../lib/redaction/redactionTypes';
import RedactionPreviewPages, {
  RedactionPreviewPagesProps,
} from './RedactionPreviewPages';
import {
  removeBoundingBoxesFromArray,
  setBoundingBoxesEnabledInArray,
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
  onEnabledChange: makeFakeHandler('onEnabledChange'),
  selectedBoxKey: null,
  onSelectedBoxKeyChange: makeFakeHandler('onSelectedBoxKeyChange'),
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
    <SelectionStoryWrapper {...args} />
  </Stack>
);

/** Owns the selected box key so clicking an overlay opens its actions. */
const SelectionStoryWrapper: React.FunctionComponent<RedactionPreviewPagesProps> =
  React.memo(function SelectionStoryWrapper(props: RedactionPreviewPagesProps) {
    const { selectedBoxKey: initialSelectedBoxKey, onSelectedBoxKeyChange } =
      props;
    const [selectedBoxKey, setSelectedBoxKey] = useState<string | null>(
      initialSelectedBoxKey
    );
    const handleSelectedBoxKeyChange = useMemoizedCallback(
      (boxKey: string | null): void => {
        setSelectedBoxKey(boxKey);
        onSelectedBoxKeyChange(boxKey);
      },
      [onSelectedBoxKeyChange]
    );
    return (
      <RedactionPreviewPages
        {...props}
        selectedBoxKey={selectedBoxKey}
        onSelectedBoxKeyChange={handleSelectedBoxKeyChange}
      />
    );
  });

export const Default: StoryFn<RedactionPreviewPagesProps> = Template.bind({});

interface StoryWrapperProps {
  initialBoxes: RedactionBoundingBox[];
  zoomPercent: number;
}

/**
 * Owns page boxes so Storybook can draw, delete, and enable redactions
 * without going through the real mutation API.
 */
const StoryWrapper: React.FunctionComponent<StoryWrapperProps> = React.memo(
  function StoryWrapper(props: StoryWrapperProps) {
    const { initialBoxes, zoomPercent } = props;
    const [boxes, setBoxes] = useState(initialBoxes);
    const [selectedBoxKey, setSelectedBoxKey] = useState<string | null>(null);
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
    const handleEnabledChange = useMemoizedCallback(
      (boxesToChange: RedactionBoundingBox[], enabled: boolean): void => {
        setBoxes((current) =>
          setBoundingBoxesEnabledInArray({
            current,
            boxes: boxesToChange,
            enabled,
          })
        );
      },
      []
    );
    const handleDeleteBoundingBoxForSingleBox =
      useConvertSingleArgumentToArray(handleDelete);
    const handleEnabledChangeForSingleBox = useMemoizedCallback(
      (box: RedactionBoundingBox, enabled: boolean): unknown =>
        handleEnabledChange([box], enabled),
      [handleEnabledChange]
    );
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
          onDeleteBoundingBox={handleDeleteBoundingBoxForSingleBox}
          onEnabledChange={handleEnabledChangeForSingleBox}
          selectedBoxKey={selectedBoxKey}
          onSelectedBoxKeyChange={setSelectedBoxKey}
          getUrlForRedactionImageForTesting={getStorybookRedactionImageUrl}
        />
      </Stack>
    );
  }
);

const DrawModeTemplate: StoryFn<StoryWrapperProps> = (args) => (
  <StoryWrapper {...args} />
);

export const DrawMode: StoryFn<StoryWrapperProps> = DrawModeTemplate.bind({});
DrawMode.args = {
  initialBoxes: storybookPreviewRedactionBoundingBoxes,
  zoomPercent: 42,
};
