import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import ActionIcon, { ActionIconProps } from './ActionIcon';
import FontAwesomeIcon from './FontAwesomeIcon';

const defaultProps: ActionIconProps = {
  tooltip: 'Toggle visibility',
  children: <FontAwesomeIcon icon={faEye} />,
};

const metadata: Meta = {
  title: 'ActionIcon',
  component: ActionIcon,
  args: defaultProps,
};
export default metadata;

const Template: StoryFn<ActionIconProps> = (args) => <ActionIcon {...args} />;

export const Default: StoryFn<ActionIconProps> = Template.bind({});
