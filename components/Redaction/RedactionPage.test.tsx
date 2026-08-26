/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { notifications } from '@mantine/notifications';
import ClientFakeData from '../../lib/testUtilities/ClientFakeData';
import { RedactionStatus } from '../../lib/models/redactionTypes';
import {
  addRedactionBoundingBoxClient,
  deleteRedactionBoundingBoxClient,
  generateRedactedPDFClient,
  getRedactionClient,
  toggleRedactionBoundingBoxClient,
} from '../clientLib/api/redaction';
import TopLevelLayoutComponents from '../TopLevelLayout/TopLevelLayoutComponents';
import RedactionPage, {
  _mutationErrorNotificationTestId,
} from './RedactionPage';
import {
  _downloadButtonTestId,
  _downloadErrorNotificationTestId,
  _redactionPanelDeleteTestId,
  _redactionPanelRowTestId,
  _redactionPanelTestId,
  _redactionPanelToggleTestId,
} from './RedactionPanel';
import { _redactionProgressTestId } from './RedactionProgress';
import {
  _addManualBoxTestId,
  _redactionPreviewTestId,
} from './RedactionPreview';
import {
  _redactionErrorMessageTestId,
  _redactionErrorTestId,
} from './RedactionError';

jest.mock('../clientLib/api/redaction', () => ({
  getRedactionClient: jest.fn(),
  generateRedactedPDFClient: jest.fn(),
  addRedactionBoundingBoxClient: jest.fn(),
  deleteRedactionBoundingBoxClient: jest.fn(),
  toggleRedactionBoundingBoxClient: jest.fn(),
}));

describe('RedactionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notifications.clean();
    jest.mocked(getRedactionClient).mockResolvedValue(redactedResponse);
    jest.mocked(generateRedactedPDFClient).mockResolvedValue(undefined);
    jest.mocked(addRedactionBoundingBoxClient).mockResolvedValue(undefined);
    jest.mocked(deleteRedactionBoundingBoxClient).mockResolvedValue(undefined);
    jest.mocked(toggleRedactionBoundingBoxClient).mockResolvedValue(undefined);
  });

  it('starts polling getRedaction on mount', async () => {
    renderRedactionPage();

    await waitFor(() => {
      expect(getRedactionClient).toHaveBeenCalledWith({
        key: redactionKey,
      });
    });
  });

  it('shows progress while the redaction is still redacting', async () => {
    jest
      .mocked(getRedactionClient)
      .mockResolvedValueOnce(redactingResponse)
      // Leave the next poll hanging so this test does not spin forever.
      .mockImplementation(
        () =>
          new Promise(() => {
            // Intentionally never resolves so polling stops after the first
            // redacting response.
          })
      );

    renderRedactionPage();

    expect(
      await screen.findByTestId(_redactionProgressTestId)
    ).toBeInTheDocument();
  });

  it('shows the review UI when the redaction is ready', async () => {
    renderRedactionPage();

    expect(
      await screen.findByTestId(_redactionPanelTestId)
    ).toBeInTheDocument();
    expect(screen.getByTestId(_redactionPreviewTestId)).toBeInTheDocument();
    expect(
      screen.getByTestId(`${_redactionPanelRowTestId}-0`)
    ).toBeInTheDocument();
  });

  it('shows the error card when getRedaction fails', async () => {
    jest
      .mocked(getRedactionClient)
      .mockRejectedValue(new Error('We could not find this redaction.'));

    renderRedactionPage();

    expect(
      await screen.findByTestId(_redactionErrorTestId)
    ).toBeInTheDocument();
    expect(screen.getByTestId(_redactionErrorMessageTestId)).toHaveTextContent(
      'We could not find this redaction.'
    );
  });

  it('rolls a failed toggle back and shows a notification', async () => {
    const user = userEvent.setup();
    jest
      .mocked(toggleRedactionBoundingBoxClient)
      .mockRejectedValue(new Error('save failed'));

    renderRedactionPage();
    await screen.findByTestId(_redactionPanelTestId);

    await user.click(screen.getByTestId(`${_redactionPanelToggleTestId}-0`));

    expect(
      await screen.findByTestId(_mutationErrorNotificationTestId)
    ).toHaveTextContent('save failed');
    expect(
      screen.getByTestId(`${_redactionPanelToggleTestId}-0`)
    ).toHaveAttribute('aria-label', 'Hide redaction');
  });

  it('does not swap to the progress view while a mutation is pending', async () => {
    const user = userEvent.setup();
    const toggleDeferred: { resolve: (() => void) | null } = {
      resolve: null,
    };
    jest.mocked(toggleRedactionBoundingBoxClient).mockImplementation(
      () =>
        new Promise((resolve) => {
          toggleDeferred.resolve = resolve;
        })
    );

    renderRedactionPage();
    await screen.findByTestId(_redactionPanelTestId);

    await user.click(screen.getByTestId(`${_redactionPanelToggleTestId}-0`));

    expect(screen.getByTestId(_redactionPanelTestId)).toBeInTheDocument();
    expect(screen.getByTestId(_redactionPreviewTestId)).toBeInTheDocument();
    expect(
      screen.queryByTestId(_redactionProgressTestId)
    ).not.toBeInTheDocument();

    toggleDeferred.resolve?.();
    await waitFor(() => {
      expect(toggleRedactionBoundingBoxClient).toHaveBeenCalled();
    });
  });

  it('shows a notification when download fails', async () => {
    const user = userEvent.setup();
    jest
      .mocked(generateRedactedPDFClient)
      .mockRejectedValue(new Error('download failed'));

    renderRedactionPage();
    await screen.findByTestId(_redactionPanelTestId);

    await user.click(screen.getByTestId(_downloadButtonTestId));

    expect(
      await screen.findByTestId(_downloadErrorNotificationTestId)
    ).toHaveTextContent('download failed');
  });

  it('shows a spinner on Download while the request is pending', async () => {
    const user = userEvent.setup();
    const downloadDeferred: { resolve: (() => void) | null } = {
      resolve: null,
    };
    jest.mocked(generateRedactedPDFClient).mockImplementation(
      () =>
        new Promise((resolve) => {
          downloadDeferred.resolve = resolve;
        })
    );

    renderRedactionPage();
    await screen.findByTestId(_redactionPanelTestId);

    await user.click(screen.getByTestId(_downloadButtonTestId));

    expect(screen.getByTestId(_downloadButtonTestId)).toHaveAttribute(
      'data-loading',
      'true'
    );

    downloadDeferred.resolve?.();
    await waitFor(() => {
      expect(screen.getByTestId(_downloadButtonTestId)).not.toHaveAttribute(
        'data-loading',
        'true'
      );
    });
  });

  it('keeps the added box when the add shim succeeds', async () => {
    const user = userEvent.setup();

    renderRedactionPage();
    await screen.findByTestId(_redactionPanelTestId);

    await user.click(screen.getByTestId(_addManualBoxTestId));

    expect(
      await screen.findByTestId(`${_redactionPanelRowTestId}-1`)
    ).toBeInTheDocument();
    expect(addRedactionBoundingBoxClient).toHaveBeenCalled();
  });

  it('removes a box when delete succeeds', async () => {
    const user = userEvent.setup();

    renderRedactionPage();
    await screen.findByTestId(_redactionPanelTestId);

    await user.click(screen.getByTestId(`${_redactionPanelDeleteTestId}-0`));

    await waitFor(() => {
      expect(
        screen.queryByTestId(`${_redactionPanelRowTestId}-0`)
      ).not.toBeInTheDocument();
    });
    expect(deleteRedactionBoundingBoxClient).toHaveBeenCalled();
  });

  function renderRedactionPage() {
    return render(
      <TopLevelLayoutComponents>
        <RedactionPage redactionKey={redactionKey} />
      </TopLevelLayoutComponents>
    );
  }

  const redactionKey = 'test-redaction-key';
  const redactedResponse = ClientFakeData.makeGetRedactionResponse();
  const redactingResponse = ClientFakeData.makeGetRedactionResponse({
    status: RedactionStatus.redacting,
    redactionBoundingBoxes: [],
  });
});
