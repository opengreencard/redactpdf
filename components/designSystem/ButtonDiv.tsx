import React from 'react';
import {
  // This design-system wrapper is the allowed Mantine UnstyledButton boundary.
  // eslint-disable-next-line no-restricted-imports
  UnstyledButton,
  type UnstyledButtonProps,
} from '@mantine/core';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';

export interface ButtonDivProps extends Omit<
  UnstyledButtonProps,
  | 'className'
  | 'component'
  | 'onClick'
  | 'onKeyDown'
  | 'role'
  | 'style'
  | 'tabIndex'
> {
  onClick: () => unknown;
  /** Required because callers provide the hover and focus-within styles. */
  className: string;
  children: React.ReactNode;
}

/** A keyboard-accessible clickable div for rows that contain nested controls. */
const ButtonDiv: React.FunctionComponent<ButtonDivProps> = React.memo(
  function ButtonDiv(props: ButtonDivProps) {
    const { children, onClick, className, ...passThroughProps } = props;
    const handleKeyDown = useMemoizedCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      },
      [onClick]
    );

    return (
      <UnstyledButton
        {...passThroughProps}
        component="div"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        style={{ cursor: 'pointer' }}
        className={className}
      >
        {children}
      </UnstyledButton>
    );
  }
);

export default ButtonDiv;
