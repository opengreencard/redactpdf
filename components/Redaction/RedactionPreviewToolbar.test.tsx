/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import RedactionPreviewToolbar, {
  _drawRedactionShortcutTestId,
  _drawRedactionSwitchTestId,
  RedactionPreviewToolbarProps,
} from './RedactionPreviewToolbar';

const defaultProps: RedactionPreviewToolbarProps = {
  pageCount: 3,
  page: 1,
  onPageChange: jest.fn(),
  zoomPercent: 100,
  onZoomChange: jest.fn(),
  isRedacting: false,
  onIsRedactingChange: jest.fn(),
};

describe('RedactionPreviewToolbar', () => {
  it('announces the R shortcut and hides the visible R from the switch name', () => {
    render(
      <MantineProvider theme={theme}>
        <RedactionPreviewToolbar {...defaultProps} />
      </MantineProvider>
    );

    // Screen readers get the shortcut from aria-keyshortcuts. The visible R
    // is aria-hidden, so it stays out of the switch's accessible name.
    expect(
      screen
        .getByTestId(_drawRedactionSwitchTestId)
        .getAttribute('aria-keyshortcuts')
    ).toBe('R');
    expect(
      screen
        .getByTestId(_drawRedactionShortcutTestId)
        .getAttribute('aria-hidden')
    ).toBe('true');
  });
});
