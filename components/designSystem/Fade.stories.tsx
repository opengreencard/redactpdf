import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Box, Stack, Text } from '@mantine/core';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import Button from './Button/Button';
import Fade from './Fade';

interface StoryWrapperProps {
  /** Start faded in so we can click Hide and watch the opacity drop. */
  initialVisible: boolean;
}

const defaultProps: StoryWrapperProps = {
  initialVisible: true,
};

const metadata: Meta = {
  title: 'Fade',
  component: Fade,
  args: defaultProps,
};
export default metadata;

/**
 * Owns the visible flag so Storybook can toggle fade without remounting
 * the child. That's the whole point of Fade vs Mantine Transition.
 */
const StoryWrapper: React.FunctionComponent<StoryWrapperProps> = React.memo(
  function StoryWrapper(props: StoryWrapperProps) {
    const { initialVisible } = props;
    const [visible, setVisible] = useState(initialVisible);
    const toggleVisible = useMemoizedCallback(() => {
      setVisible((currentVisible) => !currentVisible);
    }, []);

    return (
      <Stack p="md" gap="sm">
        <Button keyboardShortcut={null} onClick={toggleVisible}>
          {visible ? 'Fade out' : 'Fade in'}
        </Button>
        <Box p="md" bg="gray.1" bdrs="sm">
          <Fade visible={visible}>
            <Text>
              This copy stays mounted at opacity 0 when hidden, so a second
              still can fade in on top of it.
            </Text>
          </Fade>
        </Box>
      </Stack>
    );
  }
);

const Template: StoryFn<StoryWrapperProps> = (args) => (
  <StoryWrapper {...args} />
);

export const Default: StoryFn<StoryWrapperProps> = Template.bind({});

export const Hidden: StoryFn<StoryWrapperProps> = Template.bind({});
Hidden.args = { initialVisible: false };
