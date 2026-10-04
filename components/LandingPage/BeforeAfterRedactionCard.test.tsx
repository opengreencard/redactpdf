/**
 * @jest-environment jsdom
 */

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import BeforeAfterRedactionCard, {
  BeforeAfterRedactionCardProps,
  _freezeAfterButtonTestId,
  _mobileSampleImageTestId,
} from './BeforeAfterRedactionCard';

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockNextImage(props: {
    alt: string;
    src: string;
    'data-testid'?: string;
  }) {
    const { alt, src, 'data-testid': testId } = props;
    return (
      // Jest stand-in for next/image; we only assert alt and src.
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} src={src} data-testid={testId} />
    );
  },
}));

const defaultProps: BeforeAfterRedactionCardProps = {
  title: 'Dutch passport',
  beforeSrc: '/samples/dutch-passport-before.jpg',
  afterSrc: '/samples/dutch-passport-after.jpg',
  beforeAlt: 'Dutch passport specimen before redaction',
  afterAlt:
    'Dutch passport specimen after names, dates, and photos are blacked out',
  width: 885,
  height: 1280,
  intervalMs: 1000,
};

describe('BeforeAfterRedactionCard', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('flips the mobile still until After freezes it', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MantineProvider theme={theme}>
        <BeforeAfterRedactionCard {...defaultProps} />
      </MantineProvider>
    );

    const mobileStack = (): HTMLElement =>
      screen.getByTestId(_mobileSampleImageTestId);

    // Mobile starts on the unredacted still.
    expect(mobileStack().getAttribute('data-side')).toBe('before');

    // One interval later the card fades to the burned-in still.
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mobileStack().getAttribute('data-side')).toBe('after');

    // Pressing After freezes the flip on that side.
    await user.click(screen.getByTestId(_freezeAfterButtonTestId));

    // Another two intervals must not return to Before.
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(mobileStack().getAttribute('data-side')).toBe('after');
  });
});
