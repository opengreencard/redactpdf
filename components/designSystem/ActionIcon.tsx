import React from 'react';
import {
  // This design-system wrapper is the allowed Mantine ActionIcon boundary.
  // eslint-disable-next-line no-restricted-imports
  ActionIcon as MantineActionIcon,
  type ActionIconProps as MantineActionIconProps,
  Tooltip,
} from '@mantine/core';

export interface ActionIconProps extends Omit<
  MantineActionIconProps,
  'aria-label'
> {
  // Optional because icon actions may be display-only; this follows the
  // standard React button event-handler signature.
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * Required so the tooltip and accessible name stay synchronized.
   */
  tooltip: string;
}

/** Action icon with a synchronized tooltip and accessible name. */
const ActionIcon: React.FunctionComponent<ActionIconProps> = React.memo(
  function ActionIcon(props: ActionIconProps) {
    const { tooltip, ...passThroughProps } = props;

    return (
      <Tooltip label={tooltip}>
        <MantineActionIcon {...passThroughProps} aria-label={tooltip} />
      </Tooltip>
    );
  }
);

export default ActionIcon;
