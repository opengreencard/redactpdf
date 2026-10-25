import React from 'react';
import { Group, Kbd, Tooltip as MantineTooltip } from '@mantine/core';

/**
 * Plain text, or text plus shortcuts. Each shortcut renders in its own `Kbd`
 * after the text, so `{ text: 'Delete redaction', keyboardShortcut: ['Del',
 * '← Backspace'] }` shows as "Delete redaction [Del] [← Backspace]".
 */
export type TooltipContent =
  string | { text: string; keyboardShortcut: string[] };

export interface TooltipProps {
  /** Shown when the child is hovered or focused. */
  content: TooltipContent;
  /** Must forward its ref, which Mantine uses to position the tooltip. */
  children: React.ReactElement;
}

/**
 * Tooltip that can show a keyboard shortcut as a `Kbd` next to its text.
 * Use `getTooltipText` when the same copy is needed as a plain string, such
 * as an accessible name.
 */
const Tooltip: React.FunctionComponent<TooltipProps> = React.memo(
  function Tooltip(props: TooltipProps) {
    const { content, children } = props;
    if (typeof content === 'string') {
      return <MantineTooltip label={content}>{children}</MantineTooltip>;
    }
    return (
      <MantineTooltip
        label={
          <Group gap="xs" wrap="nowrap">
            {content.text}
            {content.keyboardShortcut.map((key) => (
              <Kbd key={key} size="xs">
                {key}
              </Kbd>
            ))}
          </Group>
        }
      >
        {children}
      </MantineTooltip>
    );
  }
);

/** Plain-text version of a tooltip, without any shortcut. */
export function getTooltipText(content: TooltipContent): string {
  return typeof content === 'string' ? content : content.text;
}

export default Tooltip;
