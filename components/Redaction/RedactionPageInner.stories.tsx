import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import {
  APICallState,
  makeDoneState,
  makeErrorState,
} from '../../lib/typescript/apiCallState';
import {
  GetRedactionResponse,
  ManualRedactionBoundingBox,
  RedactedGetRedactionResponse,
  RedactionBoundingBox,
  RedactionStatus,
} from '../../lib/models/redactionTypes';
import ClientFakeData from '../../lib/testUtilities/ClientFakeData';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useConvertSingleArgumentToArray } from '../../lib/hookUtilities/useConvertSingleArgumentToArray';
import RedactionPageInner from './RedactionPageInner';
import {
  addBoundingBoxesToResponse,
  removeBoundingBoxesFromResponse,
  toggleBoundingBoxesInResponse,
} from './redactionBoundingBoxes';
import {
  getStorybookRedactionImageUrl,
  makeStorybookRedactedResponse,
} from './redactionPreviewStorybookCommon';

interface StoryWrapperProps {
  redactionKey: string;
  initialRedactionState: APICallState<GetRedactionResponse> | null;
}

const defaultProps: StoryWrapperProps = {
  redactionKey: 'storybook-key',
  initialRedactionState: makeDoneState(
    ClientFakeData.makeGenericGetRedactionResponse({
      status: RedactionStatus.redacting,
    })
  ),
};

const metadata: Meta = {
  title: 'RedactionPageInner',
  component: RedactionPageInner,
  args: defaultProps,
};
export default metadata;

/**
 * Owns box-edit and highlight state so Storybook can click through the same
 * handlers the real page passes into Inner.
 */
const StoryWrapper: React.FunctionComponent<StoryWrapperProps> = React.memo(
  function StoryWrapper(props: StoryWrapperProps) {
    const { redactionKey, initialRedactionState } = props;
    const [redactionState, setRedactionState] =
      useState<APICallState<GetRedactionResponse> | null>(
        initialRedactionState
      );

    const updateRedaction = useMemoizedCallback(
      (
        apply: (
          current: RedactedGetRedactionResponse
        ) => RedactedGetRedactionResponse
      ) => {
        setRedactionState((current) => {
          if (
            !current ||
            current.status !== 'done' ||
            current.result.status !== RedactionStatus.redacted
          ) {
            return current;
          }
          const nextState: APICallState<GetRedactionResponse> = {
            ...current,
            result: apply(current.result),
          };
          return nextState;
        });
      },
      []
    );

    const handleAddBoundingBoxes = useMemoizedCallback(
      (boxes: ManualRedactionBoundingBox[]) => {
        updateRedaction((current) =>
          addBoundingBoxesToResponse(current, boxes)
        );
      },
      [updateRedaction]
    );
    const handleAddBoundingBox = useConvertSingleArgumentToArray(
      handleAddBoundingBoxes
    );
    const handleDeleteBoundingBoxes = useMemoizedCallback(
      (boxes: RedactionBoundingBox[]) => {
        updateRedaction((current) =>
          removeBoundingBoxesFromResponse(current, boxes)
        );
      },
      [updateRedaction]
    );
    const handleToggleBoundingBoxes = useMemoizedCallback(
      (boxes: RedactionBoundingBox[]) => {
        updateRedaction((current) =>
          toggleBoundingBoxesInResponse(current, boxes)
        );
      },
      [updateRedaction]
    );
    return (
      <RedactionPageInner
        redactionKey={redactionKey}
        redactionState={redactionState}
        isLoggedIn={false}
        onAddBoundingBox={handleAddBoundingBox}
        onDeleteBoundingBoxes={handleDeleteBoundingBoxes}
        onToggleBoundingBoxes={handleToggleBoundingBoxes}
        getUrlForRedactionImageForTesting={getStorybookRedactionImageUrl}
      />
    );
  }
);

const Template: StoryFn<StoryWrapperProps> = (args) => (
  <StoryWrapper {...args} />
);

export const Loading: StoryFn<StoryWrapperProps> = Template.bind({});

export const Error: StoryFn<StoryWrapperProps> = Template.bind({});
Error.args = {
  initialRedactionState: makeErrorState(
    'We could not analyze this PDF. Please try again.'
  ),
};

export const Loaded: StoryFn<StoryWrapperProps> = Template.bind({});
Loaded.args = {
  initialRedactionState: makeDoneState(makeStorybookRedactedResponse()),
};
