'use client';

import React from 'react';
import { Box } from '@mantine/core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { githubRepoUrl } from '../../lib/config/brand';
import Button from '../designSystem/Button/Button';

/** Header link to the public GitHub repo, styled like the auth buttons. */
const LandingPageViewSourceButton: React.FunctionComponent = React.memo(
  function LandingPageViewSourceButton() {
    return (
      <Button
        component="a"
        href={githubRepoUrl}
        target="_blank"
        rel="noreferrer"
        variant="subtle"
        keyboardShortcut={null}
        onClick={null}
        leftSection={{ type: 'icon', icon: faGithub }}
      >
        <Box visibleFrom="sm">View the source</Box>
      </Button>
    );
  }
);

export default LandingPageViewSourceButton;
