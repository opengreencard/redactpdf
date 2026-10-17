import React from 'react';
import { Badge } from '@mantine/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';

export interface LandingPageTagProps {
  /** Show a leading check mark, e.g. for the hero's feature list. */
  withCheck: boolean;
  children: React.ReactNode;
}

/** Small green tag in sentence case, used for hero badges and status pills. */
const LandingPageTag: React.FunctionComponent<LandingPageTagProps> = React.memo(
  function LandingPageTag(props: LandingPageTagProps) {
    const { withCheck, children } = props;

    return (
      <Badge
        variant="light"
        radius="xs"
        size="lg"
        tt="none"
        fw="normal"
        bg="green.0"
        c="green.9"
        leftSection={
          withCheck ? <FontAwesomeIcon icon={faCheck} size="xs" /> : undefined
        }
      >
        {children}
      </Badge>
    );
  }
);

export default LandingPageTag;
