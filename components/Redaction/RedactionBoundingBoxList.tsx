'use client';

import React from 'react';
import _ from 'lodash';
import { Badge, Box, Group, Stack, Text, type TextProps } from '@mantine/core';
import {
  faArrowRight,
  faEye,
  faEyeSlash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  RedactedDataType,
  RedactionBoundingBoxType,
  type RedactionBoundingBox,
} from '../../lib/redaction/redactionTypes';
import { getUnreachableError } from '../../lib/typescript/getUnreachableError';
import { useCallbackWithPrefix } from '../../lib/hookUtilities/useCallbackWithPrefix';
import { useStopPropagation } from '../../lib/hookUtilities/useStopPropagation';
import ActionIcon, { ActionIconProps } from '../designSystem/ActionIcon';
import ButtonDiv from '../designSystem/ButtonDiv';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import { getRedactionBoxLabel } from './redactionBoundingBoxes';
import classes from './RedactionBoundingBoxList.module.css';

export interface RedactionBoundingBoxListProps {
  redactionBoundingBoxes: RedactionBoundingBox[];
  onRedactionClick: (box: RedactionBoundingBox) => unknown;
  onDeleteBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
  onEnabledChange: (boxes: RedactionBoundingBox[], enabled: boolean) => unknown;
}

/**
 * Three-level redaction list with bulk actions at each grouping level.
 * For example: Person → Jane Doe → Page 1 and Page 2.
 */
const RedactionBoundingBoxList: React.FunctionComponent<RedactionBoundingBoxListProps> =
  React.memo(function RedactionBoundingBoxList(
    props: RedactionBoundingBoxListProps
  ) {
    const {
      redactionBoundingBoxes,
      onRedactionClick,
      onDeleteBoundingBoxes,
      onEnabledChange,
    } = props;
    const groups = _groupRedactionBoundingBoxes(redactionBoundingBoxes);

    return (
      <Stack gap={0} data-testid={_redactionBoundingBoxListTestId}>
        {groups.map((group) => (
          <RedactionTypeGroup
            key={group.dataType}
            group={group}
            onRedactionClick={onRedactionClick}
            onDeleteBoundingBoxes={onDeleteBoundingBoxes}
            onEnabledChange={onEnabledChange}
          />
        ))}
      </Stack>
    );
  });

export default RedactionBoundingBoxList;

/** Test ID for the grouped redaction list. Exported for tests. */
export const _redactionBoundingBoxListTestId = 'redaction-bounding-box-list';

/** Make a stable test ID for a grouped list row. Exported for tests. */
export function _makeRedactionPanelRowTestId(testIdSuffix: string): string {
  return `redaction-panel-row-${testIdSuffix}`;
}

/** Make a stable test ID for a row's view control. Exported for tests. */
export function _makeRedactionPanelViewTestId(testIdSuffix: string): string {
  return `redaction-panel-view-${testIdSuffix}`;
}

/** Make a stable test ID for a row's eye toggle. Exported for tests. */
export function _makeRedactionPanelToggleTestId(testIdSuffix: string): string {
  return `redaction-panel-toggle-${testIdSuffix}`;
}

/** Make a stable test ID for a row's delete control. Exported for tests. */
export function _makeRedactionPanelDeleteTestId(testIdSuffix: string): string {
  return `redaction-panel-delete-${testIdSuffix}`;
}

interface RedactionBoxOccurrenceGroup {
  dataType: RedactionListDataType;
  values: RedactionBoxValueGroup[];
}

interface RedactionBoxValueGroup {
  valueLabel: string;
  occurrences: RedactionBoundingBox[];
}

type RedactionListDataType = RedactedDataType | 'manual';

interface RedactionTypeGroupProps {
  group: RedactionBoxOccurrenceGroup;
  onRedactionClick: (box: RedactionBoundingBox) => unknown;
  onDeleteBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
  onEnabledChange: (boxes: RedactionBoundingBox[], enabled: boolean) => unknown;
}

/** Renders a type header and its matched-value groups. */
const RedactionTypeGroup: React.FunctionComponent<RedactionTypeGroupProps> =
  React.memo(function RedactionTypeGroup(props: RedactionTypeGroupProps) {
    const { group, onRedactionClick, onDeleteBoundingBoxes, onEnabledChange } =
      props;
    const boxes = getGroupBoxes(group);
    const areAllDisabled = areAllBoxesDisabled(boxes);
    const onDeleteBoundingBoxesWithPrefix = useCallbackWithPrefix<
      [RedactionBoundingBox[]]
    >(onDeleteBoundingBoxes);
    const onEnabledChangeWithPrefix =
      useCallbackWithPrefix<[RedactionBoundingBox[], boolean]>(onEnabledChange);

    return (
      // Groups after the first get a top rule: see the CSS module.
      <Stack gap={0} pt="xs" pb="sm" className={classes.typeGroup}>
        <RedactionRow
          text={getDataTypeText(group.dataType)}
          count={boxes.length}
          badge={null}
          indent={0}
          isEnabled={!areAllDisabled}
          testIdSuffix={_makeTypeTestIdSuffix(group.dataType)}
          onRedactionClick={null}
          onDeleteBoundingBox={onDeleteBoundingBoxesWithPrefix(boxes)}
          onEnabledChange={onEnabledChangeWithPrefix(
            getBoxesToToggle(boxes),
            getNextEnabled(boxes)
          )}
        />
        {group.values.map((valueGroup) => (
          <RedactionValueGroup
            key={valueGroup.valueLabel}
            valueGroup={valueGroup}
            groupDataType={group.dataType}
            onRedactionClick={onRedactionClick}
            onDeleteBoundingBoxes={onDeleteBoundingBoxes}
            onEnabledChange={onEnabledChange}
          />
        ))}
      </Stack>
    );
  });

interface RedactionValueGroupProps {
  valueGroup: RedactionBoxValueGroup;
  groupDataType: RedactionListDataType;
  onRedactionClick: (box: RedactionBoundingBox) => unknown;
  onDeleteBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
  onEnabledChange: (boxes: RedactionBoundingBox[], enabled: boolean) => unknown;
}

/** Renders a matched value and its page-level occurrences. */
const RedactionValueGroup: React.FunctionComponent<RedactionValueGroupProps> =
  React.memo(function RedactionValueGroup(props: RedactionValueGroupProps) {
    const {
      valueGroup,
      groupDataType,
      onRedactionClick,
      onDeleteBoundingBoxes,
      onEnabledChange,
    } = props;
    const areAllDisabled = areAllBoxesDisabled(valueGroup.occurrences);
    const occurrencesByPage = _.groupBy(
      valueGroup.occurrences,
      (occurrence) => occurrence.page
    );
    const onRedactionClickWithPrefix =
      useCallbackWithPrefix<[RedactionBoundingBox]>(onRedactionClick);
    const onDeleteBoundingBoxesWithPrefix = useCallbackWithPrefix<
      [RedactionBoundingBox[]]
    >(onDeleteBoundingBoxes);
    const onEnabledChangeWithPrefix =
      useCallbackWithPrefix<[RedactionBoundingBox[], boolean]>(onEnabledChange);

    return (
      <Stack gap={0}>
        <RedactionRow
          text={valueGroup.valueLabel}
          count={valueGroup.occurrences.length}
          badge={null}
          indent={1}
          isEnabled={!areAllDisabled}
          testIdSuffix={_makeGroupTestIdSuffix(groupDataType, valueGroup)}
          onRedactionClick={null}
          onDeleteBoundingBox={onDeleteBoundingBoxesWithPrefix(
            valueGroup.occurrences
          )}
          onEnabledChange={onEnabledChangeWithPrefix(
            getBoxesToToggle(valueGroup.occurrences),
            getNextEnabled(valueGroup.occurrences)
          )}
        />
        {Object.values(occurrencesByPage).flatMap((pageOccurrences) =>
          pageOccurrences.map((box, index) => (
            <RedactionRow
              key={getRedactionBoxKey(box)}
              text={`Page ${box.page}`}
              count={null}
              badge={pageOccurrences.length > 1 ? index + 1 : null}
              indent={2}
              isEnabled={box.enabled}
              testIdSuffix={_makeOccurrenceTestIdSuffix(
                getRedactionBoxKey(box)
              )}
              onRedactionClick={onRedactionClickWithPrefix(box)}
              onDeleteBoundingBox={onDeleteBoundingBoxesWithPrefix([box])}
              onEnabledChange={onEnabledChangeWithPrefix([box], !box.enabled)}
            />
          ))
        )}
      </Stack>
    );
  });

interface RedactionRowProps {
  text: string;
  /** Number of boxes under a type or value row, shown after the label. */
  count: number | null;
  badge: number | null;
  indent: RedactionRowIndent;
  isEnabled: boolean;
  testIdSuffix: string;
  onRedactionClick: (() => unknown) | null;
  onDeleteBoundingBox: () => unknown;
  onEnabledChange: () => unknown;
}

type RedactionRowIndent = 0 | 1 | 2;

/** Renders a grouped row and its view, toggle, and delete controls. */
const RedactionRow: React.FunctionComponent<RedactionRowProps> = React.memo(
  function RedactionRow(props: RedactionRowProps) {
    const {
      text,
      count,
      badge,
      indent,
      isEnabled,
      testIdSuffix,
      onRedactionClick,
      onDeleteBoundingBox,
      onEnabledChange,
    } = props;
    const rowStyle = redactionRowStyles[indent];
    // The label is a flex row so only the value truncates and a long label
    // keeps its count visible: "Very long na… (2)". Flex layout drops the
    // whitespace text node, so the count's margin draws the gap while the
    // space keeps the text content readable as "Name (2)".
    const labelProps: Pick<
      TextProps,
      'size' | 'td' | 'c' | 'display' | 'miw' | 'style'
    > = {
      size: rowStyle.fontSize,
      td: isEnabled ? undefined : 'line-through',
      c: getRowTextColor({ indent, isEnabled }),
      display: 'flex',
      miw: 0,
      style: { alignItems: 'baseline' },
    };
    const labelContent = (
      <>
        <Text span inherit truncate miw={0}>
          {text}
        </Text>
        {count !== null ? (
          <>
            {' '}
            <Text
              span
              ff="monospace"
              size="xs"
              fw="normal"
              lts={0}
              c="gray.6"
              ml="xs"
              style={{ flexShrink: 0 }}
            >
              ({count})
            </Text>
          </>
        ) : null}
      </>
    );
    const rowContent = (
      <Group
        pl={rowStyle.paddingLeft}
        pr="xs"
        mih={rowStyle.minHeight}
        gap="xs"
        justify="space-between"
        wrap="nowrap"
        bdrs="sm"
        data-testid={_makeRedactionPanelRowTestId(testIdSuffix)}
      >
        <Group gap="sm" wrap="nowrap" miw={0}>
          {indent === 2 ? <OccurrenceMarker isEnabled={isEnabled} /> : null}
          {indent === 0 ? (
            <Text {...labelProps} fw="bold" tt="uppercase" lts="0.03em">
              {labelContent}
            </Text>
          ) : (
            <Text {...labelProps} fw="normal">
              {labelContent}
            </Text>
          )}
          {badge !== null ? (
            <Badge
              size="sm"
              radius="xs"
              color="gray.2"
              c="gray.7"
              style={{ flexShrink: 0 }}
            >
              {badge}
            </Badge>
          ) : null}
        </Group>
        <RedactionBoxActions
          testIdSuffix={testIdSuffix}
          isEnabled={isEnabled}
          onViewRedactionClick={onRedactionClick}
          onDelete={onDeleteBoundingBox}
          onEnabledChange={onEnabledChange}
        />
      </Group>
    );
    if (onRedactionClick === null) {
      return rowContent;
    }

    return (
      <ButtonDiv onClick={onRedactionClick} className={classes.occurrenceRow}>
        {rowContent}
      </ButtonDiv>
    );
  }
);

function getRowTextColor({
  indent,
  isEnabled,
}: {
  indent: RedactionRowIndent;
  isEnabled: boolean;
}): string | undefined {
  if (!isEnabled) {
    return 'gray.6';
  }
  return indent === 1 ? undefined : 'gray.7';
}

interface OccurrenceMarkerProps {
  isEnabled: boolean;
}

/**
 * Small square echoing the red overlay on the page: outlined red when the
 * redaction is on, dashed gray when it is off.
 */
const OccurrenceMarker: React.FunctionComponent<OccurrenceMarkerProps> =
  React.memo(function OccurrenceMarker(props: OccurrenceMarkerProps) {
    const { isEnabled } = props;
    return (
      <Box
        component="span"
        w={7}
        h={7}
        bdrs={1}
        bd={
          isEnabled
            ? '1.5px solid var(--mantine-color-red-6)'
            : '1.5px dashed var(--mantine-color-gray-6)'
        }
        style={{ flexShrink: 0 }}
      />
    );
  });

interface RedactionBoxActionsProps {
  testIdSuffix: string;
  isEnabled: boolean;
  onViewRedactionClick: (() => unknown) | null;
  onDelete: () => unknown;
  onEnabledChange: () => unknown;
}

/** Renders bulk-aware view, toggle, and delete controls. */
const RedactionBoxActions: React.FunctionComponent<RedactionBoxActionsProps> =
  React.memo(function RedactionBoxActions(props: RedactionBoxActionsProps) {
    const {
      testIdSuffix,
      isEnabled,
      onViewRedactionClick,
      onDelete,
      onEnabledChange,
    } = props;
    const actionIconProps: Pick<ActionIconProps, 'variant' | 'color' | 'size'> =
      {
        variant: 'subtle',
        color: 'gray.6',
        size: 'md',
      };
    const handleView = useStopPropagation(onViewRedactionClick);
    const handleEnabledChange = useStopPropagation(onEnabledChange);
    const handleDelete = useStopPropagation(onDelete);

    return (
      <Group gap={0} wrap="nowrap">
        {onViewRedactionClick ? (
          <ActionIcon
            tooltip="View redaction"
            {...actionIconProps}
            onClick={handleView}
            data-testid={_makeRedactionPanelViewTestId(testIdSuffix)}
          >
            <FontAwesomeIcon icon={faArrowRight} size="sm" />
          </ActionIcon>
        ) : null}
        <ActionIcon
          tooltip="Toggle on/off"
          {...actionIconProps}
          onClick={handleEnabledChange}
          data-testid={_makeRedactionPanelToggleTestId(testIdSuffix)}
        >
          <FontAwesomeIcon icon={isEnabled ? faEye : faEyeSlash} size="sm" />
        </ActionIcon>
        <ActionIcon
          tooltip="Delete"
          {...actionIconProps}
          onClick={handleDelete}
          data-testid={_makeRedactionPanelDeleteTestId(testIdSuffix)}
        >
          <FontAwesomeIcon icon={faXmark} size="sm" />
        </ActionIcon>
      </Group>
    );
  });

function getGroupBoxes(
  group: RedactionBoxOccurrenceGroup
): RedactionBoundingBox[] {
  return group.values.flatMap((valueGroup) => valueGroup.occurrences);
}

function areAllBoxesDisabled(boxes: RedactionBoundingBox[]): boolean {
  return boxes.every((box) => !box.enabled);
}

// Send only the off boxes when turning a mixed group on, so already-on
// boxes stay untouched.
function getBoxesToToggle(
  boxes: RedactionBoundingBox[]
): RedactionBoundingBox[] {
  return boxes.every((box) => box.enabled)
    ? boxes
    : boxes.filter((box) => !box.enabled);
}

/**
 * Group clicks enable every off box, or disable the whole group when every
 * box is already on.
 */
function getNextEnabled(boxes: RedactionBoundingBox[]): boolean {
  return !boxes.every((box) => box.enabled);
}

function getRedactionBoxKey(box: RedactionBoundingBox): string {
  let details: string[];
  switch (box.type) {
    case RedactionBoundingBoxType.automatic:
      details = [box.dataType, box.text];
      break;
    case RedactionBoundingBoxType.manual:
      details = ['manual'];
      break;
    default:
      throw getUnreachableError(box);
  }
  return [
    ...details,
    box.page,
    box.box.minX,
    box.box.minY,
    box.box.maxX,
    box.box.maxY,
  ].join(':');
}

/** Make the type-level suffix used by all type-row test IDs. */
export function _makeTypeTestIdSuffix(dataType: RedactionListDataType): string {
  return `type-${dataType}`;
}

/** Make the value-level suffix used by all matched-value test IDs. */
export function _makeGroupTestIdSuffix(
  dataType: RedactionListDataType,
  valueGroup: RedactionBoxValueGroup
): string {
  return `value-${dataType}-${valueGroup.valueLabel}`;
}

/** Make the occurrence-level suffix used by all occurrence test IDs. */
export function _makeOccurrenceTestIdSuffix(boxKey: string): string {
  return `occurrence-${boxKey}`;
}

/**
 * Per-level row metrics for the type, value, and page rows. Tuned by eye; no
 * spec.
 */
const redactionRowStyles: Record<
  RedactionRowIndent,
  {
    paddingLeft: 'sm' | 'md' | 'xl';
    minHeight: number;
    fontSize: 'xs' | 'sm';
  }
> = {
  0: { paddingLeft: 'sm', minHeight: 36, fontSize: 'xs' },
  1: { paddingLeft: 'md', minHeight: 34, fontSize: 'sm' },
  2: { paddingLeft: 'xl', minHeight: 34, fontSize: 'sm' },
};

const redactedDataTypeToText: Record<RedactedDataType, string> = {
  [RedactedDataType.personName]: 'Person',
  [RedactedDataType.organizationName]: 'Organization',
  [RedactedDataType.address]: 'Address',
  [RedactedDataType.email]: 'Email',
  [RedactedDataType.phone]: 'Phone',
  [RedactedDataType.dateOfBirth]: 'Date of birth',
  [RedactedDataType.issueDate]: 'Issue date',
  [RedactedDataType.expiryDate]: 'Expiry date',
  [RedactedDataType.idNumber]: 'ID number',
  [RedactedDataType.accountNumber]: 'Account number',
  [RedactedDataType.documentOrCaseId]: 'Document or case ID',
  [RedactedDataType.dollarAmount]: 'Dollar amount',
  [RedactedDataType.sensitiveQuantity]: 'Quantity',
  [RedactedDataType.username]: 'Username',
  [RedactedDataType.url]: 'URL',
  [RedactedDataType.health]: 'Health',
  [RedactedDataType.personPhoto]: 'Photo',
  [RedactedDataType.signature]: 'Signature',
  [RedactedDataType.barcode]: 'Barcode',
  [RedactedDataType.checkbox]: 'Checkbox',
  [RedactedDataType.other]: 'Other',
};

/**
 * Groups boxes into type, matched-value, and page-occurrence levels while
 * retaining the enum value for the final rendering decision.
 */
export function _groupRedactionBoundingBoxes(
  redactionBoundingBoxes: RedactionBoundingBox[]
): RedactionBoxOccurrenceGroup[] {
  const boxesByDataType = _.groupBy(
    redactionBoundingBoxes,
    getRedactionListDataType
  );

  return Object.entries(boxesByDataType).map(
    ([dataType, boxes]): RedactionBoxOccurrenceGroup => {
      const boxesByValue = _.groupBy(boxes, getRedactionBoxLabel);
      const values: RedactionBoxValueGroup[] = Object.entries(boxesByValue).map(
        ([valueLabel, occurrences]): RedactionBoxValueGroup => ({
          valueLabel,
          occurrences,
        })
      );

      return {
        dataType: dataType as RedactionListDataType,
        values,
      };
    }
  );
}

function getRedactionListDataType(
  box: RedactionBoundingBox
): RedactionListDataType {
  switch (box.type) {
    case RedactionBoundingBoxType.automatic:
      return box.dataType;
    case RedactionBoundingBoxType.manual:
      return 'manual';
    default:
      throw getUnreachableError(box);
  }
}

function getDataTypeText(dataType: RedactionListDataType): string {
  if (dataType === 'manual') {
    return 'Manual';
  }
  return redactedDataTypeToText[dataType];
}
