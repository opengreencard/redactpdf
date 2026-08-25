import React from 'react';
import RedactionPageInner from './RedactionPageInner';

export interface RedactionPageProps {
  redactionKey: string;
}

/** Server entry for `/redact/:key`. Site chrome comes from root layout. */
const RedactionPage: React.FunctionComponent<RedactionPageProps> = React.memo(
  function RedactionPage(props: RedactionPageProps) {
    const { redactionKey } = props;

    return <RedactionPageInner redactionKey={redactionKey} />;
  }
);

export default RedactionPage;
