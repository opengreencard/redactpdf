import { ApplicationError } from '../../../../../lib/errors/applicationError';
import { PartialInstance } from '../../../../../lib/db/types';
import type { RedactionAttributes } from '../../../../../lib/models/Redaction';
import type {
  BoundingBox,
  GetRedactionResponse,
  RedactionBoundingBox,
} from '../../../../../lib/models/redactionTypes';
import { isSameRedactionBoundingBox } from '../../../../../lib/models/redactionBoundingBoxIdentity';
import { getRedaction } from '../getRedaction';
import {
  assertIsRedactedOrThrowApplicationError,
  findRedactionByKeyOrError,
} from '../../lib/findRedactionByKeyOrError';

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

/**
 * Load a finished redaction and reject bad page/box numbers before we
 * mutate. Add, delete, and toggle all go through here so they share the
 * same 400/409 errors.
 */
export async function loadRedactionForBoundingBoxMutation({
  key,
  page,
  box,
}: {
  key: string;
  page: number;
  box: BoundingBox;
}): Promise<MutationRedaction> {
  const redaction = await findRedactionByKeyOrError({
    key,
    attributes: [...mutationAttributes],
  });
  assertIsRedactedOrThrowApplicationError(redaction);
  assertValidPageAndBoxOrThrowApplicationError({
    page,
    box,
    pageCount: redaction.pageCount,
  });
  return redaction;
}

/**
 * Persist boxes by assigning a new array. The JSON TEXT setter only runs on
 * `set`; in-place `push` / `enabled =` would silently no-op.
 */
export async function saveRedactionBoundingBoxes({
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
export function findRedactionBoundingBoxIndexOrThrowApplicationError({
  boxes,
  page,
  box,
  type,
}: {
  boxes: RedactionBoundingBox[];
  page: number;
  box: BoundingBox;
  type: RedactionBoundingBox['type'];
}): number {
  const index = boxes.findIndex((existing) =>
    isSameRedactionBoundingBox(existing, { type, page, box })
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
