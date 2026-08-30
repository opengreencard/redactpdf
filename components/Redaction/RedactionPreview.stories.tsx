import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Stack } from '@mantine/core';
import { useConvertSingleArgumentToArray } from '../../lib/hookUtilities/useConvertSingleArgumentToArray';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import type { RedactionBoundingBox } from '../../lib/models/redactionTypes';
import {
  removeBoundingBoxesFromArray,
  toggleBoundingBoxesInArray,
} from './redactionBoundingBoxes';
import RedactionPreview, { RedactionPreviewProps } from './RedactionPreview';
import {
  getStorybookRedactionImageUrl,
  makeStorybookRedactedResponse,
  storybookPreviewRedactionBoundingBoxes,
} from './redactionPreviewStorybookCommon';

interface StoryProps {
  redactionKey: string;
  initialBoxes: RedactionBoundingBox[];
  initialIsRedactingForTesting?: boolean;
}

const defaultProps: StoryProps = {
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

const StoryWrapper: React.FunctionComponent<StoryProps> = React.memo(
  function StoryWrapper(props: StoryProps) {
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
    const handleToggle = useMemoizedCallback(
      (boxesToToggle: RedactionBoundingBox[]): void => {
        setBoxes((current) =>
          toggleBoundingBoxesInArray(current, boxesToToggle)
        );
      },
      []
    );
    const onDeleteBoundingBox = useConvertSingleArgumentToArray(handleDelete);
    const onToggleBoundingBox = useConvertSingleArgumentToArray(handleToggle);
    const previewProps: RedactionPreviewProps = {
      redactionKey,
      redactionResponse: makeStorybookRedactedResponse({
        redactionBoundingBoxes: boxes,
      }),
      onAddBoundingBox: handleAdd,
      onDeleteBoundingBox,
      onToggleBoundingBox,
      getUrlForRedactionImageForTesting: getStorybookRedactionImageUrl,
      initialIsRedactingForTesting,
    };
    return <RedactionPreview {...previewProps} />;
  }
);

const Template: StoryFn<StoryProps> = (args) => (
  <Stack h="80vh">
    <StoryWrapper {...args} />
  </Stack>
);

export const Default: StoryFn<StoryProps> = Template.bind({});

export const DrawModeOn: StoryFn<StoryProps> = Template.bind({});
DrawModeOn.args = { initialIsRedactingForTesting: true };
