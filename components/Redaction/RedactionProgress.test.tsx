/**
 * @jest-environment jsdom
 */

import MockDate from 'mockdate';
import { estimatedMsPerPage } from '../../lib/redaction/estimatedMsPerPage';
import { _getRedactionProgressPercent } from './RedactionProgress';

describe('_getRedactionProgressPercent', () => {
  afterEach(() => {
    MockDate.reset();
  });

  it('estimates halfway through a two-page document', () => {
    const createdAtTimestamp = Date.parse('2026-01-01T00:00:00.000Z');
    const overrideEstimatedMsPerPage = estimatedMsPerPage;
    const endAtTimestamp = createdAtTimestamp + 2 * overrideEstimatedMsPerPage;
    MockDate.set(createdAtTimestamp + overrideEstimatedMsPerPage);

    expect(
      _getRedactionProgressPercent({
        createdAtTimestamp,
        endAtTimestamp,
        now: Date.now(),
      })
    ).toBeCloseTo(50);
  });

  it('caps progress while processing runs longer than estimated', () => {
    const createdAtTimestamp = Date.parse('2026-01-01T00:00:00.000Z');
    const endAtTimestamp = createdAtTimestamp + 2 * estimatedMsPerPage;
    const now = endAtTimestamp + 1;

    expect(
      _getRedactionProgressPercent({
        createdAtTimestamp,
        endAtTimestamp,
        now,
      })
    ).toBe(99);
  });

  it('does not report progress before the creation time', () => {
    const createdAtTimestamp = Date.parse('2026-01-01T00:00:00.000Z');
    const endAtTimestamp = createdAtTimestamp + 2 * estimatedMsPerPage;
    const now = createdAtTimestamp - 1;

    expect(
      _getRedactionProgressPercent({
        createdAtTimestamp,
        endAtTimestamp,
        now,
      })
    ).toBe(0);
  });
});
