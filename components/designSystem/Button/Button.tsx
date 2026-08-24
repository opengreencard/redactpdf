'use client';

import React, { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import {
  // This existing design-system wrapper is also an approved Mantine Button boundary.
  // eslint-disable-next-line no-restricted-imports
  Button as MantineButton,
  ButtonProps as MantineButtonProps,
  Group,
} from '@mantine/core';
import KeyboardShortcut, { KeyboardShortcutValue } from '../KeyboardShortcut';
import ButtonLeftOrRightSection, {
  ButtonSection,
} from './ButtonLeftOrRightSection';
import fullWidthStyles from './Button.fullWidth.module.css';
import { isNotNullOrUndefined } from '../../../lib/typescript/isNotNullOrUndefined';
import { useMemoizedCallback } from '../../../lib/hookUtilities/useMemoizedCallback';

export interface ButtonProps
  extends
    Omit<MantineButtonProps, 'leftSection' | 'rightSection'>,
    Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  component?: React.ElementType;
  href?: string;
  leftSection?: ButtonSection;
  rightSection?: ButtonSection;
  keyboardShortcut: KeyboardShortcutValue | null;
  /**
   * Pass in `null` if this is a type="submit" button used for submitting
   * a form
   */
  onClick: (() => unknown) | null;
  /**
   * Event tracked after the caller's click handler runs. Pass null when the
   * button does not represent a meaningful analytics action.
   */
}

/** A button with an associated keyboard shortcut */
const Button: React.FunctionComponent<ButtonProps> = React.memo(function Button(
  props: PropsWithChildren<ButtonProps>
) {
  const {
    keyboardShortcut,
    leftSection,
    rightSection,
    children,
    ...passThroughProps
  } = props;
  const { onClick, fullWidth } = props;
  const handleClick = useMemoizedCallback(() => {
    onClick?.();
  }, [onClick]);

  // For fullWidth buttons, to make sure everything is centered, if only
  // leftSection or rightSection is provided, we duplicate the section
  // on the other side but make it invisible
  let renderedLeftSection = [
    leftSection && <ButtonLeftOrRightSection key={0} section={leftSection} />,
  ].filter(isNotNullOrUndefined);

  let renderedRightSection: React.JSX.Element[];
  renderedRightSection = [
    rightSection && <ButtonLeftOrRightSection key={0} section={rightSection} />,
    keyboardShortcut ? (
      <KeyboardShortcut
        key={1}
        shortcut={keyboardShortcut}
        onPress={handleClick}
      />
    ) : null,
  ].filter(isNotNullOrUndefined);

  let leftSectionVisibility: 'visible' | 'hidden' = 'visible';
  let rightSectionVisibility: 'visible' | 'hidden' = 'visible';

  if (fullWidth) {
    if (renderedLeftSection.length > 0 && renderedRightSection.length === 0) {
      renderedRightSection = renderedLeftSection;
      rightSectionVisibility = 'hidden';
    } else if (
      renderedLeftSection.length === 0 &&
      renderedRightSection.length > 0
    ) {
      renderedLeftSection = renderedRightSection;
      leftSectionVisibility = 'hidden';
    }
  }

  return (
    <MantineButtonWithProps
      {...passThroughProps}
      onClick={handleClick}
      leftSection={
        <Group gap="xs" style={{ visibility: leftSectionVisibility }}>
          {renderedLeftSection}
        </Group>
      }
      rightSection={
        <Group gap="xs" style={{ visibility: rightSectionVisibility }}>
          {renderedRightSection}
        </Group>
      }
      classNames={fullWidth ? fullWidthStyles : undefined}
    >
      {children}
    </MantineButtonWithProps>
  );
});

// ButtonProps exposes app-specific section descriptors plus analytics and
// keyboard-shortcut props. By this point, the wrapper-only props have been
// consumed and the section descriptors have been rendered into React nodes.
type MantineButtonWithRenderedSectionsProps = Omit<
  ButtonProps,
  'clickEvent' | 'keyboardShortcut' | 'leftSection' | 'rightSection'
> & {
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
};

// MantineButton is a polymorphic component, so TypeScript cannot directly
// reconcile its generic props with this transformed, concrete prop shape.
// This is compile-time only: the value is still the original Mantine button.
const MantineButtonWithProps: React.FunctionComponent<MantineButtonWithRenderedSectionsProps> =
  MantineButton as React.FunctionComponent<MantineButtonWithRenderedSectionsProps>;

export default Button;
