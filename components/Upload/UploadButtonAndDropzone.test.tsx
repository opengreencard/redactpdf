/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { ErrorCode } from 'react-dropzone';
import { theme } from '../../theme';
import { uploadFileForRedactionClient } from '../clientLib/api/redaction';
import UploadButtonAndDropzone from './UploadButtonAndDropzone';
import {
  _getDropRejectionMessage,
  _uploadPDFInputTestId,
} from './UploadButtonAndDropzoneInner';

jest.mock('../clientLib/api/redaction', () => ({
  uploadFileForRedactionClient: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('UploadButtonAndDropzone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(uploadFileForRedactionClient).mockResolvedValue({
      key: uploadedRedactionKey,
      pageCount: 1,
    });
  });

  it('uploads one PDF and navigates to the redaction page', async () => {
    const user = userEvent.setup();
    render(
      <MantineProvider theme={theme}>
        <UploadButtonAndDropzone enableFullScreenDrop={false} />
      </MantineProvider>
    );

    const fileInput = screen.getByTestId(_uploadPDFInputTestId);
    await user.upload(fileInput, pdfFile);

    await waitFor(() => {
      expect(uploadFileForRedactionClient).toHaveBeenCalledWith({
        file: pdfFile,
      });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/redact/${uploadedRedactionKey}`);
    });
  });
});

describe(_getDropRejectionMessage, () => {
  it('names the file when the type is not a PDF', () => {
    expect(
      _getDropRejectionMessage([
        {
          file: textFile,
          errors: [
            {
              code: ErrorCode.FileInvalidType,
              message: 'File type must be pdf',
            },
          ],
        },
      ])
    ).toBe(`${textFile.name} is not a PDF. Please upload a PDF.`);
  });
});

const uploadedRedactionKey = 'test-redaction-key';
const pdfFile = new File(['%PDF-1.4 test'], 'document.pdf', {
  type: 'application/pdf',
});
const textFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });
