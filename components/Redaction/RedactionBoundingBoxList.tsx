'use client';

import React from 'react';
import _ from 'lodash';
import { Group, Stack, Text } from '@mantine/core';
import {
  faArrowRight,
  faEye,
  faEyeSlash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  RedactedDataType,
  type RedactionBoundingBox,
} from '../../lib/models/redactionTypes';
import { getUnreachableError } from '../../lib/typescript/getUnreachableError';
import { useCallbackWithPrefix } from '../../lib/hookUtilities/useCallbackWithPrefix';
import { useStopPropagation } from '../../lib/hookUtilities/useStopPropagation';
import ActionIcon from '../designSystem/ActionIcon';
import ButtonDiv from '../designSystem/ButtonDiv';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import { getRedactionBoxLabel } from './redactionBoundingBoxes';
import classes from './RedactionBoundingBoxList.module.css';

export interface RedactionBoundingBoxListProps {
  redactionBoundingBoxes: RedactionBoundingBox[];
  onRedactionClick: (box: RedactionBoundingBox) => unknown;
  onDeleteBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
  onToggleBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
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
      onToggleBoundingBoxes,
    } = props;
    const groups = _groupRedactionBoundingBoxes(redactionBoundingBoxes);

    return (
      <Stack gap="sm" data-testid={_redactionBoundingBoxListTestId}>
        {groups.map((group) => (
          <RedactionTypeGroup
            key={group.dataType}
            group={group}
            onRedactionClick={onRedactionClick}
            onDeleteBoundingBoxes={onDeleteBoundingBoxes}
            onToggleBoundingBoxes={onToggleBoundingBoxes}
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
  onToggleBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
}

/** Renders a type header and its matched-value groups. */
const RedactionTypeGroup: React.FunctionComponent<RedactionTypeGroupProps> =
  React.memo(function RedactionTypeGroup(props: RedactionTypeGroupProps) {
    const {
      group,
      onRedactionClick,
      onDeleteBoundingBoxes,
      onToggleBoundingBoxes,
    } = props;
    const boxes = getGroupBoxes(group);
    const areAllDisabled = areAllBoxesDisabled(boxes);
    const onDeleteBoundingBoxesWithPrefix = useCallbackWithPrefix<
      [RedactionBoundingBox[]]
    >(onDeleteBoundingBoxes);
    const onToggleBoundingBoxesWithPrefix = useCallbackWithPrefix<
      [RedactionBoundingBox[]]
    >(onToggleBoundingBoxes);

    return (
      <Stack gap={0}>
        <RedactionRow
          text={`${getDataTypeText(group.dataType)} (${boxes.length})`}
          textStyle="bold"
          indent={0}
          isEnabled={!areAllDisabled}
          testIdSuffix={_makeTypeTestIdSuffix(group.dataType)}
          onRedactionClick={null}
          onDeleteBoundingBox={onDeleteBoundingBoxesWithPrefix(boxes)}
          onToggleBoundingBox={onToggleBoundingBoxesWithPrefix(
            getBoxesToToggle(boxes)
          )}
        />
        {group.values.map((valueGroup) => (
          <RedactionValueGroup
            key={valueGroup.valueLabel}
            valueGroup={valueGroup}
            groupDataType={group.dataType}
            onRedactionClick={onRedactionClick}
            onDeleteBoundingBoxes={onDeleteBoundingBoxes}
            onToggleBoundingBoxes={onToggleBoundingBoxes}
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
  onToggleBoundingBoxes: (boxes: RedactionBoundingBox[]) => unknown;
}

/** Renders a matched value and its page-level occurrences. */
const RedactionValueGroup: React.FunctionComponent<RedactionValueGroupProps> =
  React.memo(function RedactionValueGroup(props: RedactionValueGroupProps) {
    const {
      valueGroup,
      groupDataType,
      onRedactionClick,
      onDeleteBoundingBoxes,
      onToggleBoundingBoxes,
    } = props;
    const areAllDisabled = areAllBoxesDisabled(valueGroup.occurrences);
    const onRedactionClickWithPrefix =
      useCallbackWithPrefix<[RedactionBoundingBox]>(onRedactionClick);
    const onDeleteBoundingBoxesWithPrefix = useCallbackWithPrefix<
      [RedactionBoundingBox[]]
    >(onDeleteBoundingBoxes);
    const onToggleBoundingBoxesWithPrefix = useCallbackWithPrefix<
      [RedactionBoundingBox[]]
    >(onToggleBoundingBoxes);

    return (
      <Stack gap={0}>
        <RedactionRow
          text={`${valueGroup.valueLabel} (${valueGroup.occurrences.length})`}
          indent={1}
          isEnabled={!areAllDisabled}
          testIdSuffix={_makeGroupTestIdSuffix(groupDataType, valueGroup)}
          onRedactionClick={null}
          onDeleteBoundingBox={onDeleteBoundingBoxesWithPrefix(
            valueGroup.occurrences
          )}
          onToggleBoundingBox={onToggleBoundingBoxesWithPrefix(
            getBoxesToToggle(valueGroup.occurrences)
          )}
        />
        {valueGroup.occurrences.map((box, index) => (
          <RedactionRow
            key={getRedactionBoxKey(box)}
            text={
              valueGroup.occurrences.length > 1
                ? `Page ${box.page} (${index + 1})`
                : `Page ${box.page}`
            }
            indent={2}
            isEnabled={box.enabled}
            testIdSuffix={_makeOccurrenceTestIdSuffix(getRedactionBoxKey(box))}
            onRedactionClick={onRedactionClickWithPrefix(box)}
            onDeleteBoundingBox={onDeleteBoundingBoxesWithPrefix([box])}
            onToggleBoundingBox={onToggleBoundingBoxesWithPrefix([box])}
          />
        ))}
      </Stack>
    );
  });

interface RedactionRowProps {
  text: string;
  textStyle?: 'bold' | 'normal';
  indent: RedactionRowIndent;
  isEnabled: boolean;
  testIdSuffix: string;
  onRedactionClick: (() => unknown) | null;
  onDeleteBoundingBox: () => unknown;
  onToggleBoundingBox: () => unknown;
}

type RedactionRowIndent = 0 | 1 | 2;

/** Renders a grouped row and its view, toggle, and delete controls. */
const RedactionRow: React.FunctionComponent<RedactionRowProps> = React.memo(
  function RedactionRow(props: RedactionRowProps) {
    const {
      text,
      textStyle = 'normal',
      indent,
      isEnabled,
      testIdSuffix,
      onRedactionClick,
      onDeleteBoundingBox,
      onToggleBoundingBox,
    } = props;
    const rowContent = (
      <Group
        pl={getRedactionRowPadding(indent)}
        gap="xs"
        justify="space-between"
        wrap="nowrap"
        bdrs="sm"
        data-testid={_makeRedactionPanelRowTestId(testIdSuffix)}
      >
        {textStyle === 'bold' ? (
          <Text
            fw="bold"
            td={isEnabled ? undefined : 'line-through'}
            c={isEnabled ? undefined : 'dimmed'}
          >
            {text}
          </Text>
        ) : (
          <Text
            fw="normal"
            td={isEnabled ? undefined : 'line-through'}
            c={isEnabled ? undefined : 'dimmed'}
          >
            {text}
          </Text>
        )}
        <RedactionBoxActions
          testIdSuffix={testIdSuffix}
          isEnabled={isEnabled}
          onViewRedactionClick={onRedactionClick}
          onDelete={onDeleteBoundingBox}
          onToggle={onToggleBoundingBox}
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

interface RedactionBoxActionsProps {
  testIdSuffix: string;
  isEnabled: boolean;
  onViewRedactionClick: (() => unknown) | null;
  onDelete: () => unknown;
  onToggle: () => unknown;
}

/** Renders bulk-aware view, toggle, and delete controls. */
const RedactionBoxActions: React.FunctionComponent<RedactionBoxActionsProps> =
  React.memo(function RedactionBoxActions(props: RedactionBoxActionsProps) {
    const {
      testIdSuffix,
      isEnabled,
      onViewRedactionClick,
      onDelete,
      onToggle,
    } = props;
    const handleView = useStopPropagation(onViewRedactionClick);
    const handleToggle = useStopPropagation(onToggle);
    const handleDelete = useStopPropagation(onDelete);

    return (
      <Group gap="xs" wrap="nowrap">
        {onViewRedactionClick ? (
          <ActionIcon
            tooltip="View redaction"
            variant="subtle"
            onClick={handleView}
            data-testid={_makeRedactionPanelViewTestId(testIdSuffix)}
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </ActionIcon>
        ) : null}
        <ActionIcon
          tooltip="Toggle on/off"
          variant="subtle"
          onClick={handleToggle}
          data-testid={_makeRedactionPanelToggleTestId(testIdSuffix)}
        >
          <FontAwesomeIcon icon={isEnabled ? faEye : faEyeSlash} />
        </ActionIcon>
        <ActionIcon
          tooltip="Delete"
          variant="subtle"
          onClick={handleDelete}
          data-testid={_makeRedactionPanelDeleteTestId(testIdSuffix)}
        >
          <FontAwesomeIcon icon={faXmark} />
        </ActionIcon>
      </Group>
    );
  });

function getRedactionRowPadding(
  indent: RedactionRowIndent
): 'md' | 'xl' | undefined {
  switch (indent) {
    case 0:
      return undefined;
    case 1:
      return 'md';
    case 2:
      return 'xl';
    default:
      throw getUnreachableError(indent);
  }
}

function getGroupBoxes(
  group: RedactionBoxOccurrenceGroup
): RedactionBoundingBox[] {
  return group.values.flatMap((valueGroup) => valueGroup.occurrences);
}

function areAllBoxesDisabled(boxes: RedactionBoundingBox[]): boolean {
  return boxes.every((box) => !box.enabled);
}

function getBoxesToToggle(
  boxes: RedactionBoundingBox[]
): RedactionBoundingBox[] {
  return boxes.every((box) => box.enabled)
    ? boxes
    : boxes.filter((box) => !box.enabled);
}

function getRedactionBoxKey(box: RedactionBoundingBox): string {
  const details =
    box.type === 'automatic' ? [box.dataType, box.text] : ['manual'];
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
    case 'automatic':
      return box.dataType;
    case 'manual':
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
