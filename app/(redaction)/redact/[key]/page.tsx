import type { Metadata } from 'next';
import React from 'react';
import RedactionPage from '../../../../components/Redaction/RedactionPage';

export const metadata: Metadata = {
  title: 'Review redactions',
  description: 'Review AI redaction suggestions for your uploaded PDF.',
};

interface RedactRouteParams {
  key: string;
}

export interface RedactRoutePageProps {
  params: Promise<RedactRouteParams>;
}

/** App Router entry for `/redact/:key` after a successful upload. */
// Next.js requires `export default function` for app route pages.
// eslint-disable-next-line no-restricted-syntax
export default async function RedactRoutePage(
  props: RedactRoutePageProps
): Promise<React.ReactElement> {
  const { params } = props;
  const { key } = await params;

  return <RedactionPage redactionKey={key} />;
}
