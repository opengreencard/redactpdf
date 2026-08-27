'use client';

import React from 'react';
import _ from 'lodash';
import {
  ActionIcon,
  Group,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
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
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import { useCallbackWithPrefix } from '../../lib/hookUtilities/useCallbackWithPrefix';
import { useMemoizedCallback } from '../../lib/hookUtilities/useMemoizedCallback';
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
        <Group
          justify="space-between"
          wrap="nowrap"
          data-testid={_makeRedactionPanelRowTestId(
            _makeTypeTestIdSuffix(group.dataType)
          )}
        >
          <Text
            fw="bold"
            td={areAllDisabled ? 'line-through' : undefined}
            c={areAllDisabled ? 'dimmed' : undefined}
          >
            {getDataTypeText(group.dataType)} ({boxes.length})
          </Text>
          <RedactionBoxActions
            testIdSuffix={_makeTypeTestIdSuffix(group.dataType)}
            isEnabled={boxes.every((box) => box.enabled)}
            onDelete={onDeleteBoundingBoxesWithPrefix(boxes)}
            onToggle={onToggleBoundingBoxesWithPrefix(getBoxesToToggle(boxes))}
          />
        </Group>
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
      <Stack gap={0} pl="md">
        <Group
          justify="space-between"
          wrap="nowrap"
          data-testid={_makeRedactionPanelRowTestId(
            _makeGroupTestIdSuffix(groupDataType, valueGroup)
          )}
        >
          <Text
            fw="normal"
            td={areAllDisabled ? 'line-through' : undefined}
            c={areAllDisabled ? 'dimmed' : undefined}
          >
            {valueGroup.valueLabel} ({valueGroup.occurrences.length})
          </Text>
          <RedactionBoxActions
            testIdSuffix={_makeGroupTestIdSuffix(groupDataType, valueGroup)}
            isEnabled={valueGroup.occurrences.every((box) => box.enabled)}
            onDelete={onDeleteBoundingBoxesWithPrefix(valueGroup.occurrences)}
            onToggle={onToggleBoundingBoxesWithPrefix(
              getBoxesToToggle(valueGroup.occurrences)
            )}
          />
        </Group>
        {valueGroup.occurrences.map((box, index) => (
          <RedactionOccurrenceRow
            key={getRedactionBoxKey(box)}
            box={box}
            indexToShow={valueGroup.occurrences.length > 1 ? index : null}
            onRedactionClick={onRedactionClickWithPrefix(box)}
            onDeleteBoundingBox={onDeleteBoundingBoxesWithPrefix([box])}
            onToggleBoundingBox={onToggleBoundingBoxesWithPrefix([box])}
          />
        ))}
      </Stack>
    );
  });

interface RedactionOccurrenceRowProps {
  box: RedactionBoundingBox;
  indexToShow: number | null;
  onRedactionClick: () => unknown;
  onDeleteBoundingBox: () => unknown;
  onToggleBoundingBox: () => unknown;
}

/** Renders one clickable page occurrence and its individual controls. */
const RedactionOccurrenceRow: React.FunctionComponent<RedactionOccurrenceRowProps> =
  React.memo(function RedactionOccurrenceRow(
    props: RedactionOccurrenceRowProps
  ) {
    const {
      box,
      indexToShow,
      onRedactionClick,
      onDeleteBoundingBox,
      onToggleBoundingBox,
    } = props;
    const occurrenceLabel =
      indexToShow === null
        ? `Page ${box.page}`
        : `Page ${box.page} (${indexToShow + 1})`;
    const boxKey = getRedactionBoxKey(box);

    return (
      <Group
        pl="xl"
        gap="xs"
        justify="space-between"
        wrap="nowrap"
        bdrs="sm"
        style={{ cursor: 'pointer' }}
        className={classes.occurrenceRow}
        data-testid={_makeRedactionPanelRowTestId(
          _makeOccurrenceTestIdSuffix(boxKey)
        )}
      >
        <UnstyledButton
          onClick={onRedactionClick}
          flex={1}
          miw={0}
          ta="left"
          td={box.enabled ? undefined : 'line-through'}
          c={box.enabled ? undefined : 'dimmed'}
        >
          <Text>{occurrenceLabel}</Text>
        </UnstyledButton>
        <Tooltip label="View redaction">
          <ActionIcon
            variant="subtle"
            aria-label="View redaction"
            onClick={onRedactionClick}
            data-testid={_makeRedactionPanelViewTestId(
              _makeOccurrenceTestIdSuffix(boxKey)
            )}
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </ActionIcon>
        </Tooltip>
        <RedactionBoxActions
          testIdSuffix={_makeOccurrenceTestIdSuffix(boxKey)}
          isEnabled={box.enabled}
          onDelete={onDeleteBoundingBox}
          onToggle={onToggleBoundingBox}
        />
      </Group>
    );
  });

interface RedactionBoxActionsProps {
  testIdSuffix: string;
  isEnabled: boolean;
  onDelete: () => unknown;
  onToggle: () => unknown;
}

/** Renders bulk-aware view, toggle, and delete controls. */
const RedactionBoxActions: React.FunctionComponent<RedactionBoxActionsProps> =
  React.memo(function RedactionBoxActions(props: RedactionBoxActionsProps) {
    const { testIdSuffix, isEnabled, onDelete, onToggle } = props;
    const handleToggle = useMemoizedCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onToggle();
      },
      [onToggle]
    );
    const handleDelete = useMemoizedCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onDelete();
      },
      [onDelete]
    );

    return (
      <Group gap="xs" wrap="nowrap">
        <Tooltip label="Toggle on/off">
          <ActionIcon
            variant="subtle"
            aria-label="Toggle on/off"
            onClick={handleToggle}
            data-testid={_makeRedactionPanelToggleTestId(testIdSuffix)}
          >
            <FontAwesomeIcon icon={isEnabled ? faEye : faEyeSlash} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete">
          <ActionIcon
            variant="subtle"
            aria-label="Delete"
            onClick={handleDelete}
            data-testid={_makeRedactionPanelDeleteTestId(testIdSuffix)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </ActionIcon>
        </Tooltip>
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
