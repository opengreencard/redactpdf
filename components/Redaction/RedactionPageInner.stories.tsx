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
} from '../../lib/models/redactionTypes';
import ClientFakeData from '../../lib/testUtilities/ClientFakeData';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import SiteChrome from '../SiteChrome/SiteChrome';
import RedactionPageInner from './RedactionPageInner';
import {
  addBoundingBoxToResponse,
  removeBoundingBoxFromResponse,
  toggleBoundingBoxInResponse,
} from './redactionBoundingBoxes';

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

    const handleAddBoundingBox = useMemoizedCallback(
      (box: ManualRedactionBoundingBox) => {
        updateRedaction((current) => addBoundingBoxToResponse(current, box));
      },
      [updateRedaction]
    );
    const handleDeleteBoundingBox = useMemoizedCallback(
      (box: RedactionBoundingBox) => {
        updateRedaction((current) =>
          removeBoundingBoxFromResponse(current, box)
        );
      },
      [updateRedaction]
    );
    const handleToggleBoundingBox = useMemoizedCallback(
      (box: RedactionBoundingBox) => {
        updateRedaction((current) => toggleBoundingBoxInResponse(current, box));
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
        onDeleteBoundingBox={handleDeleteBoundingBox}
        onToggleBoundingBox={handleToggleBoundingBox}
        highlightedBox={highlightedBox}
        onRedactionClick={handleRedactionClick}
      />
    );
  }
);

const Template: StoryFn<StoryWrapperProps> = (args) => (
  <SiteChrome isLoggedIn={false}>
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
          dataType: 'address',
          text: '123 Main St',
        }),
        ClientFakeData.makeManualRedactionBoundingBox({ page: 2 }),
      ],
    })
  ),
};
