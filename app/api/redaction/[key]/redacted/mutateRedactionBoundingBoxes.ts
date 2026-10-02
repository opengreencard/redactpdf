import { ApplicationError } from '../../../../../lib/errors/applicationError';
import { PartialInstance } from '../../../../../lib/db/types';
import type { RedactionAttributes } from '../../../../../lib/models/Redaction';
import type {
  BoundingBox,
  GetRedactionResponse,
  ManualRedactionBoundingBox,
  RedactionBoundingBox,
} from '../../../../../lib/models/redactionTypes';
import { isSameRedactionBoundingBox } from '../../../../../lib/models/redactionBoundingBoxIdentity';
import { getUnreachableError } from '../../../../../lib/typescript/getUnreachableError';
import { getRedaction } from '../getRedaction';
import {
  assertIsRedactedOrThrowApplicationError,
  findRedactionByKeyOrError,
} from '../../lib/findRedactionByKeyOrError';

/**
 * Identity of an existing box. Delete and setEnabled look up this way.
 */
export interface LocateRedactionBoundingBoxRequest {
  page: number;
  box: BoundingBox;
  type: RedactionBoundingBox['type'];
}

/**
 * Draw a new box. Callers don't send `type` — we always create `manual`.
 */
export interface AddRedactionBoundingBoxMutation {
  op: 'add';
  page: number;
  box: BoundingBox;
}

/** Remove one automatic or manual box. */
export interface DeleteRedactionBoundingBoxMutation extends LocateRedactionBoundingBoxRequest {
  op: 'delete';
}

/**
 * Write `enabled` to a specific value so a missed request cannot invert the
 * next click.
 */
export interface SetRedactionBoundingBoxEnabledMutation extends LocateRedactionBoundingBoxRequest {
  op: 'setEnabled';
  enabled: boolean;
}

export type RedactionBoundingBoxMutation =
  | AddRedactionBoundingBoxMutation
  | DeleteRedactionBoundingBoxMutation
  | SetRedactionBoundingBoxEnabledMutation;

/**
 * Path `key` plus the JSON body. The client sends this whole object; the
 * route splits `key` into the URL.
 */
export interface MutateRedactionBoundingBoxesRequest {
  key: string;
  mutations: RedactionBoundingBoxMutation[];
}

export type MutateRedactionBoundingBoxesPathParams = Pick<
  MutateRedactionBoundingBoxesRequest,
  'key'
>;

export type MutateRedactionBoundingBoxesBody = Omit<
  MutateRedactionBoundingBoxesRequest,
  'key'
>;

/**
 * Apply every mutation in order, then save once. A throw before save leaves
 * the JSON column unchanged, so the client can roll back optimistic edits.
 */
export async function mutateRedactionBoundingBoxes({
  key,
  mutations,
}: MutateRedactionBoundingBoxesRequest): Promise<GetRedactionResponse> {
  const redaction = await findRedactionByKeyOrError({
    key,
    attributes: [...mutationAttributes],
  });
  assertIsRedactedOrThrowApplicationError(redaction);

  if (mutations.length === 0) {
    return getRedaction({ key });
  }

  let { redactionBoundingBoxes } = redaction;
  for (const mutation of mutations) {
    redactionBoundingBoxes = applyRedactionBoundingBoxMutation({
      boxes: redactionBoundingBoxes,
      mutation,
      pageCount: redaction.pageCount,
    });
  }

  return saveRedactionBoundingBoxes({
    key,
    redaction,
    redactionBoundingBoxes,
  });
}

// `id` is required so Sequelize can UPDATE instead of attempting a global save.
const mutationAttributes = [
  'id',
  'status',
  'pageCount',
  'redactionBoundingBoxes',
] as const;

type MutationRedaction = PartialInstance<
  RedactionAttributes,
  (typeof mutationAttributes)[number]
>;

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
    case 'add': {
      assertValidPageAndBoxOrThrowApplicationError({
        page: mutation.page,
        box: mutation.box,
        pageCount,
      });
      const manualBox: ManualRedactionBoundingBox = {
        type: 'manual',
        page: mutation.page,
        box: mutation.box,
        enabled: true,
      };
      return [...boxes, manualBox];
    }
    case 'delete': {
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
    case 'setEnabled': {
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
 * Persist boxes by assigning a new array. The JSON TEXT setter only runs on
 * `set`; in-place `push` / `enabled =` would silently no-op.
 */
async function saveRedactionBoundingBoxes({
  key,
  redaction,
  redactionBoundingBoxes,
}: {
  key: string;
  redaction: MutationRedaction;
  redactionBoundingBoxes: RedactionBoundingBox[];
}): Promise<GetRedactionResponse> {
  // We have to assign on this instance; a copy wouldn't save the same row.
  // eslint-disable-next-line no-param-reassign
  redaction.redactionBoundingBoxes = redactionBoundingBoxes;
  await redaction.save();
  return getRedaction({ key });
}

/**
 * Boxes don't have ids — we match type, page, and coordinates. If two
 * boxes share that identity, we update the first one.
 */
function findRedactionBoundingBoxIndexOrThrowApplicationError({
  boxes,
  locate,
}: {
  boxes: RedactionBoundingBox[];
  locate: LocateRedactionBoundingBoxRequest;
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
