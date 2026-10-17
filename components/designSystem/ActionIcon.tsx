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
  /**
   * Set on toggle buttons only. It picks the variant, color, and aria-pressed,
   * so callers pass neither. Leave it unset for plain action buttons.
   */
  isPressed?: boolean;
}

/** Action icon with a synchronized tooltip and accessible name. */
const ActionIcon: React.FunctionComponent<ActionIconProps> = React.memo(
  function ActionIcon(props: ActionIconProps) {
    const { tooltip, isPressed, ...passThroughProps } = props;

    // Plain actions get no toggle props, so the caller's variant, color, and
    // aria-pressed pass through unchanged.
    let toggleProps: Partial<
      Pick<MantineActionIconProps, 'variant' | 'color'> &
        Pick<React.AriaAttributes, 'aria-pressed'>
    > = {};
    if (isPressed === true) {
      toggleProps = { variant: 'light', color: 'green', 'aria-pressed': true };
    } else if (isPressed === false) {
      toggleProps = {
        variant: 'transparent',
        color: 'gray.7',
        'aria-pressed': false,
      };
    }

    return (
      <Tooltip label={tooltip}>
        <MantineActionIcon
          {...passThroughProps}
          {...toggleProps}
          aria-label={tooltip}
        />
      </Tooltip>
    );
  }
);

export default ActionIcon;
