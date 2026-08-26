import React from 'react';
import { Alert, Anchor, Stack, Text } from '@mantine/core';

export interface RedactionErrorProps {
  message: string | null;
}

/**
 * Safe error card for a failed GET or a `status: error` redaction.
 * Task 2.9 replaces this shim with the finished Alert treatment.
 */
const RedactionError: React.FunctionComponent<RedactionErrorProps> = React.memo(
  function RedactionError(props: RedactionErrorProps) {
    const { message } = props;

    return (
      <Alert
        color="red"
        title="Redaction failed"
        data-testid={_redactionErrorTestId}
      >
        <Stack gap="sm">
          <Text data-testid={_redactionErrorMessageTestId}>
            {message ?? 'We could not analyze this PDF. Please try again.'}
          </Text>
          <Anchor href="/">Back to home</Anchor>
        </Stack>
      </Alert>
    );
  }
);

export default RedactionError;

/** Test ID for the redaction error alert. Exported for tests. */
export const _redactionErrorTestId = 'redaction-error';

/** Test ID for the user-facing error message. Exported for tests. */
export const _redactionErrorMessageTestId = 'redaction-error-message';
