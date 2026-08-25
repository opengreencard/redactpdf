import React from 'react';
import { Container, Stack, Text, Title } from '@mantine/core';
import { siteContainerSize } from '../SiteChrome/SiteChrome';

export interface RedactionPageInnerProps {
  redactionKey: string;
}

/**
 * Placeholder review UI for `/redact/:key` until the real redaction page
 * lands. Accepts `redactionKey` so the route can pass the upload id through
 * without changing the page contract later.
 */
const RedactionPageInner: React.FunctionComponent<RedactionPageInnerProps> =
  React.memo(function RedactionPageInner(props: RedactionPageInnerProps) {
    const { redactionKey } = props;

    return (
      <Container
        size={siteContainerSize}
        py="xl"
        aria-label={`Redaction ${redactionKey}`}
      >
        <Stack gap="md">
          <Title order={1}>Review redactions</Title>
          <Text c="dimmed">
            Your PDF was uploaded. The review page is coming soon.
          </Text>
        </Stack>
      </Container>
    );
  });

export default RedactionPageInner;
