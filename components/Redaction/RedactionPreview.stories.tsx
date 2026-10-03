import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Stack } from '@mantine/core';
import { useConvertSingleArgumentToArray } from '../../lib/hookUtilities/useConvertSingleArgumentToArray';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import type { RedactionBoundingBox } from '../../lib/models/redactionTypes';
import {
  removeBoundingBoxesFromArray,
  setBoundingBoxesEnabledInArray,
} from './redactionBoundingBoxes';
import RedactionPreview, { RedactionPreviewProps } from './RedactionPreview';
import {
  getStorybookRedactionImageUrl,
  makeStorybookRedactedResponse,
  storybookPreviewRedactionBoundingBoxes,
} from './redactionPreviewStorybookCommon';

interface StoryWrapperProps {
  redactionKey: string;
  initialBoxes: RedactionBoundingBox[];
  initialIsRedactingForTesting?: boolean;
}

const defaultProps: StoryWrapperProps = {
  redactionKey: 'storybook-key',
  initialBoxes: storybookPreviewRedactionBoundingBoxes,
  initialIsRedactingForTesting: false,
};

const metadata: Meta = {
  title: 'RedactionPreview',
  component: RedactionPreview,
  args: defaultProps,
};
export default metadata;

const StoryWrapper: React.FunctionComponent<StoryWrapperProps> = React.memo(
  function StoryWrapper(props: StoryWrapperProps) {
    const { redactionKey, initialBoxes, initialIsRedactingForTesting } = props;
    const [boxes, setBoxes] = useState(initialBoxes);
    const handleAdd = useMemoizedCallback((box: RedactionBoundingBox): void => {
      setBoxes((current) => [...current, box]);
    }, []);
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
    const previewProps: RedactionPreviewProps = {
      redactionKey,
      redactionResponse: makeStorybookRedactedResponse({
        redactionBoundingBoxes: boxes,
      }),
      onAddBoundingBox: handleAdd,
      onDeleteBoundingBox: handleDeleteBoundingBoxForSingleBox,
      onEnabledChange: handleEnabledChangeForSingleBox,
      getUrlForRedactionImageForTesting: getStorybookRedactionImageUrl,
      initialIsRedactingForTesting,
    };
    return <RedactionPreview {...previewProps} />;
  }
);

const Template: StoryFn<StoryWrapperProps> = (args) => (
  <Stack h="80vh">
    <StoryWrapper {...args} />
  </Stack>
);

export const Default: StoryFn<StoryWrapperProps> = Template.bind({});

export const DrawModeOn: StoryFn<StoryWrapperProps> = Template.bind({});
DrawModeOn.args = { initialIsRedactingForTesting: true };
