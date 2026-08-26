import React from 'react';
import { Progress, Stack, Text, Title } from '@mantine/core';

export interface RedactionProgressProps {
  pageCount: number;
  createdAt: string;
}

/**
 * Labeled analyzing bar shown while a redaction is still `redacting`.
 * Task 2.8 replaces this shim with the timed estimate from `createdAt`.
 */
const RedactionProgress: React.FunctionComponent<RedactionProgressProps> =
  React.memo(function RedactionProgress(props: RedactionProgressProps) {
    const { pageCount, createdAt } = props;
    const pageLabel = pageCount === 1 ? 'page' : 'pages';

    return (
      <Stack
        maw="32rem"
        mx="auto"
        gap="md"
        data-testid={_redactionProgressTestId}
        aria-label={`Analyzing ${pageCount} ${pageLabel}, started ${createdAt}`}
      >
        <Title order={2}>
          Detecting sensitive information in your document.
        </Title>
        <Progress value={40} />
        <Text c="dimmed">
          Analyzing {pageCount} {pageLabel}…
        </Text>
      </Stack>
    );
  });

export default RedactionProgress;

/** Test ID for the analyzing-progress region. Exported for tests. */
export const _redactionProgressTestId = 'redaction-progress';
