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
  width: 1920,
  height: 2778,
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
    expect(mobileStack().getAttribute('data-side')).toBe('before');

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mobileStack().getAttribute('data-side')).toBe('after');

    await user.click(screen.getByTestId(_freezeAfterButtonTestId));
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    // Frozen on After: another interval must not flip back to Before.
    expect(mobileStack().getAttribute('data-side')).toBe('after');
  });
});
