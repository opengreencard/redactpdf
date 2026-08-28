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
  RedactionBoundingBox,
  RedactionStatus,
  RedactedDataType,
} from '../../lib/models/redactionTypes';
import ClientFakeData from '../../lib/testUtilities/ClientFakeData';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useConvertSingleArgumentToArray } from '../../lib/hookUtilities/useConvertSingleArgumentToArray';
import SiteChrome from '../SiteChrome/SiteChrome';
import RedactionPageInner from './RedactionPageInner';
import {
  addBoundingBoxesToResponse,
  removeBoundingBoxesFromResponse,
  toggleBoundingBoxesInResponse,
} from './redactionBoundingBoxes';
import { redactionPageContainerSize } from './redactionLayout';

interface StoryWrapperProps {
  redactionKey: string;
  initialRedactionState: APICallState<GetRedactionResponse> | null;
}

const defaultProps: StoryWrapperProps = {
  redactionKey: 'storybook-key',
  initialRedactionState: makeDoneState(
    ClientFakeData.makeGetRedactionResponse({
      status: RedactionStatus.redacting,
      redactionBoundingBoxes: [],
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
    const [highlightedBox, setHighlightedBox] =
      useState<RedactionBoundingBox | null>(null);

    const updateRedaction = useMemoizedCallback(
      (apply: (current: GetRedactionResponse) => GetRedactionResponse) => {
        setRedactionState((current) => {
          if (!current || current.status !== 'done' || !current.result) {
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
    const handleRedactionClick = useMemoizedCallback(
      (box: RedactionBoundingBox) => {
        setHighlightedBox(box);
      },
      []
    );

    return (
      <RedactionPageInner
        redactionKey={redactionKey}
        redactionState={redactionState}
        onAddBoundingBox={handleAddBoundingBox}
        onDeleteBoundingBoxes={handleDeleteBoundingBoxes}
        onToggleBoundingBoxes={handleToggleBoundingBoxes}
        highlightedBox={highlightedBox}
        onRedactionClick={handleRedactionClick}
      />
    );
  }
);

const Template: StoryFn<StoryWrapperProps> = (args) => (
  <SiteChrome isLoggedIn={false} containerSize={redactionPageContainerSize}>
    <StoryWrapper {...args} />
  </SiteChrome>
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
  initialRedactionState: makeDoneState(
    ClientFakeData.makeGetRedactionResponse({
      pageCount: 2,
      redactionBoundingBoxes: [
        ClientFakeData.makeAutoRedactionBoundingBox({
          dataType: RedactedDataType.address,
          text: '123 Main St',
        }),
        ClientFakeData.makeManualRedactionBoundingBox({ page: 2 }),
      ],
    })
  ),
};
