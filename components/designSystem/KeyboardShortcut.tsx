'use client';

import React, { PropsWithChildren, useEffect, useMemo } from 'react';
import { Kbd } from '@mantine/core';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';

export interface KeyboardShortcutProps {
  shortcut: KeyboardShortcutValue;
  /**
   * If null, will still show the keyboard shortcut, but will not
   * add event handlers
   */
  onPress: (() => unknown) | null;
}

export type KeyboardShortcutValue =
  SingleKeyKeyboardShortcut | CompoundKeyboardShortcut;

export interface CompoundKeyboardShortcut extends CompoundKeyModifiers {
  shortcut: SingleKeyKeyboardShortcut;
}

export type SingleKeyKeyboardShortcut = string | KeyboardShortcutSpecialKey;

export enum KeyboardShortcutSpecialKey {
  enter = 'enter',
  delete = 'delete',
  escape = 'escape',
}

/**
 * A component that displays a keyboard shortcut. When visible, will also
 * trigger the keyboard shortcut when pressed
 */
const KeyboardShortcut: React.FunctionComponent<KeyboardShortcutProps> =
  React.memo(function KeyboardShortcut(
    props: PropsWithChildren<KeyboardShortcutProps>
  ) {
    const { shortcut, onPress } = props;

    const shortcutInfo = useMemo(
      () => getKeyboardShortcutInfo(shortcut),
      [shortcut]
    );

    const handleKeyPress = useMemoizedCallback(
      (event: KeyboardEvent) => {
        if (
          onPress &&
          event.key.toLowerCase() === shortcutInfo.key.toLowerCase() &&
          event.altKey === !!shortcutInfo.altKey &&
          event.shiftKey === !!shortcutInfo.shiftKey &&
          event.ctrlKey === !!shortcutInfo.ctrlKey &&
          event.metaKey === !!shortcutInfo.metaKey
        ) {
          onPress();
        }
      },
      [
        onPress,
        shortcutInfo.altKey,
        shortcutInfo.ctrlKey,
        shortcutInfo.key,
        shortcutInfo.metaKey,
        shortcutInfo.shiftKey,
      ]
    );

    useEffect(() => {
      setTimeout(() => {
        // We need this setTimeout because if:
        // 1. Someone presses a key and
        // 2. It causes this element to appear
        // then the keydown event will be triggered immediately.
        document.addEventListener('keydown', handleKeyPress);
      }, 0);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    return <Kbd size="xs">{shortcutInfo.text}</Kbd>;
  });

/**
 * Normalized representation of keyboard shortcuts so that they can
 * be consistently displayed and handled by keyboard handlers
 */
interface KeyboardShortcutInfo extends CompoundKeyModifiers {
  text: string;
  /**
   * Should correspond to the key's `event.key` value:
   * https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
   */
  key: string;
}

interface CompoundKeyModifiers {
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

const specialKeyToKeyInfo: {
  [specialKey in KeyboardShortcutSpecialKey]: KeyboardShortcutInfo;
} = {
  [KeyboardShortcutSpecialKey.enter]: {
    text: 'Enter ↵',
    key: 'Enter',
  },
  [KeyboardShortcutSpecialKey.delete]: {
    text: 'Del',
    key: 'Delete',
  },
  [KeyboardShortcutSpecialKey.escape]: {
    text: 'Esc',
    key: 'Escape',
  },
};

function getKeyboardShortcutInfo(
  shortcut: KeyboardShortcutValue
): KeyboardShortcutInfo {
  const compoundShortcut: CompoundKeyboardShortcut =
    typeof shortcut === 'object' ? shortcut : { shortcut };
  const { shortcut: singleShortcut, ...modifiers } = compoundShortcut;

  let ret: KeyboardShortcutInfo;
  if (singleShortcut in specialKeyToKeyInfo) {
    ret = {
      ...specialKeyToKeyInfo[singleShortcut as KeyboardShortcutSpecialKey],
      ...modifiers,
    };
  } else {
    ret = {
      ...modifiers,
      text: singleShortcut.toUpperCase(),
      key: singleShortcut,
    };
  }

  if (ret.altKey) {
    ret.text = `Alt + ${ret.text}`;
  }

  if (ret.shiftKey) {
    ret.text = `Shift + ${ret.text}`;
  }

  if (ret.metaKey) {
    ret.text = `Cmd/Win + ${ret.text}`;
  }

  if (ret.ctrlKey) {
    ret.text = `Ctrl + ${ret.text}`;
  }

  return ret;
}

export default KeyboardShortcut;
