'use client';

import React from 'react';
import _ from 'lodash';
import {
  faChevronDown,
  faChevronUp,
  faMinus,
  faObjectGroup,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import {
  Group,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  NumberInput,
  Switch,
  Text,
} from '@mantine/core';
import { useCallbackWithPrefix } from '../../lib/hookUtilities/useCallbackWithPrefix';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
import { useSetState } from '../../lib/hookUtilities/useSetState';
import ActionIcon, { ActionIconProps } from '../designSystem/ActionIcon';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';

export type RedactionPreviewZoom =
  | { type: 'percent'; percent: number }
  | { type: 'fitToPage' }
  | { type: 'fitToWidth' };

export interface RedactionPreviewToolbarProps {
  /** Total pages in the current document. */
  pageCount: number;
  /** 1-based page shown in the input. */
  page: number;
  onPageChange: (page: number) => unknown;
  zoomPercent: number;
  onZoomChange: (zoom: RedactionPreviewZoom) => unknown;
  /** When true, pointer drags on a page create a manual redaction box. */
  isRedacting: boolean;
  onIsRedactingChange: (isRedacting: boolean) => unknown;
}

const zoomPresets = [25, 50, 100, 125, 150, 200, 400, 800, 1600];

/**
 * Controls page navigation, zoom, and manual redaction mode.
 * Previous/next use up/down chevrons because the canvas scrolls vertically.
 * Zoom is a minus / editable percent / plus group with a preset dropdown.
 */
const RedactionPreviewToolbar: React.FunctionComponent<RedactionPreviewToolbarProps> =
  React.memo(function RedactionPreviewToolbar(
    props: RedactionPreviewToolbarProps
  ) {
    const {
      pageCount,
      page,
      onPageChange,
      zoomPercent,
      onZoomChange,
      isRedacting,
      onIsRedactingChange,
    } = props;
    const changePage = useMemoizedCallback(
      (nextPage: number): void => {
        onPageChange(_.clamp(nextPage, 1, pageCount || 1));
      },
      [onPageChange, pageCount]
    );

    // NumberInput can emit an empty string while the field is being edited.
    const handlePageInputChange = useMemoizedCallback(
      (value: string | number): void => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          changePage(value);
        }
      },
      [changePage]
    );

    const handleZoomPercentChange = useMemoizedCallback(
      (value: string | number): void => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          onZoomChange({
            type: 'percent',
            percent: _.clamp(value, 1, 2000),
          });
        }
      },
      [onZoomChange]
    );

    const handlePreviousPage = useSetState(changePage, page - 1);

    const handleNextPage = useSetState(changePage, page + 1);

    const handleDrawRedactionChange = useMemoizedCallback(
      (event: React.ChangeEvent<HTMLInputElement>) =>
        onIsRedactingChange(event.currentTarget.checked),
      [onIsRedactingChange]
    );

    // Mobile uses the same draw-mode state but needs a compact one-tap control
    // so page navigation, zoom, and drawing fit on one toolbar row.
    const handleDrawRedactionToggle = useMemoizedCallback(
      () => onIsRedactingChange(!isRedacting),
      [isRedacting, onIsRedactingChange]
    );

    const setPresetZoom = useMemoizedCallback(
      (percent: number) => onZoomChange({ type: 'percent', percent }),
      [onZoomChange]
    );
    const handlePresetZoom = useCallbackWithPrefix<[number]>(setPresetZoom);

    // +/- step to the next named preset rather than a fixed increment so
    // 100 → 125 matches the dropdown instead of landing on 110.
    const handleZoomOut = useMemoizedCallback(
      () =>
        onZoomChange({
          type: 'percent',
          percent: getAdjacentZoomPercent(zoomPercent, -1),
        }),
      [onZoomChange, zoomPercent]
    );

    const handleZoomIn = useMemoizedCallback(
      () =>
        onZoomChange({
          type: 'percent',
          percent: getAdjacentZoomPercent(zoomPercent, 1),
        }),
      [onZoomChange, zoomPercent]
    );

    const handleFitToPage = useSetState(onZoomChange, fitToPageZoom);

    const handleFitToWidth = useSetState(onZoomChange, fitToWidthZoom);

    return (
      <Group gap="xs" align="center" wrap="nowrap" w="100%">
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            {...pageActionIconCommonProps}
            tooltip="Previous page"
            disabled={page <= 1}
            onClick={handlePreviousPage}
          >
            <FontAwesomeIcon icon={faChevronUp} />
          </ActionIcon>
          <Group gap="xs" wrap="nowrap">
            <NumberInput
              aria-label="Current page"
              value={page}
              min={1}
              max={pageCount}
              clampBehavior="strict"
              allowDecimal={false}
              allowNegative={false}
              hideControls
              w={40}
              onChange={handlePageInputChange}
            />
            <Text c="dimmed">/ {pageCount}</Text>
          </Group>
          <ActionIcon
            {...pageActionIconCommonProps}
            tooltip="Next page"
            disabled={page >= pageCount}
            onClick={handleNextPage}
          >
            <FontAwesomeIcon icon={faChevronDown} />
          </ActionIcon>
        </Group>
        <Group
          gap={0}
          wrap="nowrap"
          bd="1px solid gray.4"
          bdrs="sm"
          aria-label="Zoom"
        >
          <ActionIcon
            {...toolbarActionIconCommonProps}
            tooltip="Zoom out"
            visibleFrom="xs"
            disabled={zoomPercent <= zoomPresets[0]}
            onClick={handleZoomOut}
          >
            <FontAwesomeIcon icon={faMinus} />
          </ActionIcon>
          <NumberInput
            aria-label="Zoom percent"
            value={zoomPercent}
            min={1}
            max={2000}
            clampBehavior="strict"
            allowDecimal={false}
            allowNegative={false}
            hideControls
            suffix="%"
            w={64}
            variant="unstyled"
            styles={{
              input: {
                paddingInline: 'var(--mantine-spacing-xs)',
              },
            }}
            onChange={handleZoomPercentChange}
          />
          <Menu withinPortal position="bottom-start">
            <MenuTarget>
              <ActionIcon
                {...toolbarActionIconCommonProps}
                tooltip="Zoom options"
              >
                <FontAwesomeIcon icon={faChevronDown} />
              </ActionIcon>
            </MenuTarget>
            <MenuDropdown>
              {zoomPresets.map((percent) => (
                <MenuItem key={percent} onClick={handlePresetZoom(percent)}>
                  {percent}%
                </MenuItem>
              ))}
              <MenuDivider />
              <MenuItem onClick={handleFitToPage}>Fit to page</MenuItem>
              <MenuItem onClick={handleFitToWidth}>Fit to width</MenuItem>
            </MenuDropdown>
          </Menu>
          <ActionIcon
            {...toolbarActionIconCommonProps}
            tooltip="Zoom in"
            visibleFrom="xs"
            disabled={zoomPercent >= zoomPresets[zoomPresets.length - 1]}
            onClick={handleZoomIn}
          >
            <FontAwesomeIcon icon={faPlus} />
          </ActionIcon>
        </Group>
        <Switch
          visibleFrom="xs"
          label="Draw redaction"
          checked={isRedacting}
          onChange={handleDrawRedactionChange}
        />
        <ActionIcon
          {...toolbarActionIconCommonProps}
          hiddenFrom="xs"
          tooltip="Toggle draw redaction"
          variant={isRedacting ? 'light' : 'transparent'}
          aria-pressed={isRedacting}
          onClick={handleDrawRedactionToggle}
        >
          <FontAwesomeIcon icon={faObjectGroup} />
        </ActionIcon>
      </Group>
    );
  });

export default RedactionPreviewToolbar;

function getAdjacentZoomPercent(
  currentPercent: number,
  direction: -1 | 1
): number {
  if (direction === 1) {
    const nextPreset = zoomPresets.find(
      (preset): boolean => preset > currentPercent
    );
    return nextPreset ?? zoomPresets[zoomPresets.length - 1];
  }
  const previousPreset = [...zoomPresets]
    .reverse()
    .find((preset): boolean => preset < currentPercent);
  return previousPreset ?? zoomPresets[0];
}

const fitToPageZoom: RedactionPreviewZoom = { type: 'fitToPage' };
const fitToWidthZoom: RedactionPreviewZoom = { type: 'fitToWidth' };

const toolbarActionIconCommonProps: Pick<ActionIconProps, 'variant'> = {
  variant: 'transparent',
};

// Keep disabled page navigation transparent so an unavailable direction does
// not add a gray background to the toolbar.
const pageActionIconCommonProps: Pick<ActionIconProps, 'variant' | 'bg'> = {
  ...toolbarActionIconCommonProps,
  bg: 'transparent',
};
