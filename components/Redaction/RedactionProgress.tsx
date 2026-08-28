'use client';

import React, { useEffect, useState } from 'react';
import { Progress, Stack, Text, Title } from '@mantine/core';
import type { GetRedactionResponse } from '../../lib/models/redactionTypes';
import { estimatedMsPerPage } from '../../lib/redaction/estimatedMsPerPage';
import Card from '../designSystem/Card';
import { centeredAlertOrCardMaxWidth } from './redactionLayout';

export interface RedactionProgressProps {
  redaction: Pick<GetRedactionResponse, 'pageCount' | 'createdAt'>;
  /** Testing-only override for deterministic progress calculations. */
  overrideEstimatedMsPerPage?: number;
}

/**
 * Labeled analyzing bar shown while a redaction is still `redacting`.
 * The percentage is an estimate driven by the document creation time and a
 * conservative per-page duration; it is not server-reported progress.
 */
const RedactionProgress: React.FunctionComponent<RedactionProgressProps> =
  React.memo(function RedactionProgress(props: RedactionProgressProps) {
    const { redaction, overrideEstimatedMsPerPage } = props;
    const { pageCount, createdAt } = redaction;
    const effectiveEstimatedMsPerPage =
      overrideEstimatedMsPerPage ?? estimatedMsPerPage;
    const createdAtTimestamp = Date.parse(createdAt);
    const endAtTimestamp =
      createdAtTimestamp + pageCount * effectiveEstimatedMsPerPage;

    /** Set to now on mount, then updated every X ms to keep bar moving */
    const [now, setNow] = useState<number>(() => Date.now());
    const pageLabel = pageCount === 1 ? 'page' : 'pages';

    const percent = _getRedactionProgressPercent({
      createdAtTimestamp,
      endAtTimestamp,
      now,
    });
    const remainingSeconds = Math.ceil(
      Math.max(0, endAtTimestamp - now) / 1000
    );
    const isFinishing = now >= endAtTimestamp;

    useEffect(() => {
      if (isFinishing) {
        return undefined;
      }

      const updateNow = (): void => {
        setNow(Date.now());
      };
      updateNow();
      const intervalId = window.setInterval(
        updateNow,
        redactionProgressUpdateIntervalMs
      );

      return (): void => {
        window.clearInterval(intervalId);
      };
    }, [isFinishing]);

    return (
      <Card
        maw={centeredAlertOrCardMaxWidth}
        mx="auto"
        data-testid={_redactionProgressTestId}
        aria-label={`Analyzing ${pageCount} ${pageLabel}, started ${createdAt}`}
      >
        <Stack gap="md">
          <Title order={2}>
            Detecting sensitive information in your document.
          </Title>
          <Progress
            value={percent}
            aria-label="Redaction progress"
            transitionDuration={redactionProgressUpdateIntervalMs * 2}
          />
          <Text>
            {isFinishing
              ? 'Finishing up…'
              : `About ${remainingSeconds} seconds left`}
          </Text>
          <Text c="dimmed">Large documents can take longer to analyze.</Text>
        </Stack>
      </Card>
    );
  });

export default RedactionProgress;

/** Refresh cadence for the estimated progress bar. */
export const redactionProgressUpdateIntervalMs = 250;

interface RedactionProgressPercentOptions {
  createdAtTimestamp: number;
  endAtTimestamp: number;
  now: number;
}

/**
 * Estimates progress without claiming that the server has completed work.
 * The cap leaves a visible final step for the GET response that changes the
 * document from `redacting` to `redacted`.
 */
export function _getRedactionProgressPercent(
  options: RedactionProgressPercentOptions
): number {
  const { createdAtTimestamp, endAtTimestamp, now } = options;
  const duration = endAtTimestamp - createdAtTimestamp;

  if (duration <= 0 || now >= endAtTimestamp) {
    return 99;
  }

  const elapsed = Math.max(0, now - createdAtTimestamp);
  return Math.min(99, (elapsed / duration) * 100);
}

/** Test ID for the analyzing-progress region. Exported for tests. */
export const _redactionProgressTestId = 'redaction-progress';
