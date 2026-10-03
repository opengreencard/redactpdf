import { ApplicationError } from '../../../../../lib/errors/applicationError';
import type {
  BoundingBox,
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
} from '../../../../../lib/redaction/redactionTypes';
import { RedactionBoundingBoxType } from '../../../../../lib/redaction/redactionTypes';
import { RedactionBoundingBoxMutationOp } from '../../../../../lib/redaction/redactionBoundingBoxMutation';
import type { RedactionBoundingBoxMutation } from '../../../../../lib/redaction/redactionBoundingBoxMutation';
import type {
  MutateRedactionBoundingBoxesBody,
  MutateRedactionBoundingBoxesPathParams,
} from '../../../../../lib/redaction/redactionAPI';
import { isSameRedactionBoundingBox } from '../../../../../lib/redaction/redactionBoundingBoxIdentity';
import { getUnreachableError } from '../../../../../lib/typescript/getUnreachableError';
import {
  assertIsRedactedOrThrowApplicationError,
  findRedactionByKeyOrError,
} from '../../lib/findRedactionByKeyOrError';

/**
 * Apply every mutation in order, then save once. A throw before save leaves
 * the JSON column unchanged, so the client can roll back optimistic edits.
 *
 * We don't return the saved document — the client already applied the same
 * edits locally.
 */
export async function mutateRedactionBoundingBoxes({
  key,
  mutations,
}: MutateRedactionBoundingBoxesPathParams &
  MutateRedactionBoundingBoxesBody): Promise<void> {
  const redaction = await findRedactionByKeyOrError({
    key,
    attributes: [...mutationAttributes],
  });
  assertIsRedactedOrThrowApplicationError(redaction);

  if (mutations.length === 0) {
    return;
  }

  let { redactionBoundingBoxes } = redaction;
  for (const mutation of mutations) {
    redactionBoundingBoxes = applyRedactionBoundingBoxMutation({
      boxes: redactionBoundingBoxes,
      mutation,
      pageCount: redaction.pageCount,
    });
  }

  // Persist boxes by assigning a new array. The JSON TEXT setter only runs
  // on `set`; in-place `push` / `enabled =` would silently no-op.
  // We have to assign on this instance; a copy wouldn't save the same row.
  // eslint-disable-next-line no-param-reassign
  redaction.redactionBoundingBoxes = redactionBoundingBoxes;
  await redaction.save();
}

// `id` is required so Sequelize can UPDATE instead of attempting a global save.
const mutationAttributes = [
  'id',
  'status',
  'pageCount',
  'redactionBoundingBoxes',
] as const;

/**
 * Apply one mutation to an in-memory list. We validate here so a later
 * item in the batch can fail before we write the JSON column.
 */
function applyRedactionBoundingBoxMutation({
  boxes,
  mutation,
  pageCount,
}: {
  boxes: RedactionBoundingBox[];
  mutation: RedactionBoundingBoxMutation;
  pageCount: number;
}): RedactionBoundingBox[] {
  switch (mutation.op) {
    case RedactionBoundingBoxMutationOp.add: {
      assertValidPageAndBoxOrThrowApplicationError({
        page: mutation.page,
        box: mutation.box,
        pageCount,
      });
      const manualBox: ManualRedactionBoundingBox = {
        type: RedactionBoundingBoxType.manual,
        page: mutation.page,
        box: mutation.box,
        enabled: true,
      };
      return [...boxes, manualBox];
    }
    case RedactionBoundingBoxMutationOp.delete: {
      assertValidPageAndBoxOrThrowApplicationError({
        page: mutation.page,
        box: mutation.box,
        pageCount,
      });
      const index = findRedactionBoundingBoxIndexOrThrowApplicationError({
        boxes,
        locate: mutation,
      });
      return boxes.filter(
        (_existing, existingIndex) => existingIndex !== index
      );
    }
    case RedactionBoundingBoxMutationOp.setEnabled: {
      assertValidPageAndBoxOrThrowApplicationError({
        page: mutation.page,
        box: mutation.box,
        pageCount,
      });
      const index = findRedactionBoundingBoxIndexOrThrowApplicationError({
        boxes,
        locate: mutation,
      });
      return boxes.map((existing, existingIndex): RedactionBoundingBox =>
        existingIndex === index
          ? { ...existing, enabled: mutation.enabled }
          : existing
      );
    }
    default:
      throw getUnreachableError(mutation);
  }
}

/**
 * Boxes don't have IDs, so we use `isSameRedactionBoundingBox`. If two
 * boxes share that identity, we update the first one.
 */
function findRedactionBoundingBoxIndexOrThrowApplicationError({
  boxes,
  locate,
}: {
  boxes: RedactionBoundingBox[];
  locate: Pick<RedactionBoundingBox, 'type' | 'page' | 'box'>;
}): number {
  const index = boxes.findIndex((existing) =>
    isSameRedactionBoundingBox(existing, locate)
  );
  if (index === -1) {
    throw new ApplicationError('We could not find that redaction box.', 404);
  }
  return index;
}

/**
 * Pages are 1-based like the PDF viewer. Coordinates are 0–1 so they
 * survive page-size changes.
 */
function assertValidPageAndBoxOrThrowApplicationError({
  page,
  box,
  pageCount,
}: {
  page: number;
  box: BoundingBox;
  pageCount: number;
}): void {
  if (!Number.isInteger(page) || page < 1 || page > pageCount) {
    throw new ApplicationError(
      'The redaction page must be an integer between 1 and the page count.',
      400
    );
  }

  const coordinates: number[] = [box.minX, box.minY, box.maxX, box.maxY];
  if (
    coordinates.some(
      (value) => !Number.isFinite(value) || value < 0 || value > 1
    ) ||
    box.minX >= box.maxX ||
    box.minY >= box.maxY
  ) {
    throw new ApplicationError(
      'Redaction box coordinates must be between 0 and 1, with min less than max.',
      400
    );
  }
}
