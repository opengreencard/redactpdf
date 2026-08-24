import React from 'react';
import { Container, Stack, Text, Title } from '@mantine/core';

export interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/** Provides the shared page shell for RedactPDF.ai legal documents. */
const LegalPage: React.FunctionComponent<LegalPageProps> = React.memo(
  function LegalPage(props: LegalPageProps) {
    const { title, lastUpdated, children } = props;

    return (
      <Container size="md" py="xl">
        <Stack gap="xl">
          <Stack gap="xs">
            <Title order={1}>{title}</Title>
            <Text c="dimmed">Last updated: {lastUpdated}</Text>
          </Stack>
          {children}
        </Stack>
      </Container>
    );
  }
);

export default LegalPage;
