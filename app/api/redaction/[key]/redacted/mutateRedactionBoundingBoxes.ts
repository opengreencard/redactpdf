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
const mutationAttributes: (
  'id' | 'status' | 'pageCount' | 'redactionBoundingBoxes'
)[] = ['id', 'status', 'pageCount', 'redactionBoundingBoxes'];

type MutationRedaction = PartialInstance<
  RedactionAttributes,
  'id' | 'status' | 'pageCount' | 'redactionBoundingBoxes'
>;

/**
 * Load a finished redaction and reject bad page/box numbers before we mutate.
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
    attributes: mutationAttributes,
  });
  assertIsRedactedOrThrowApplicationError(redaction);
  assertValidPageAndBoxOrThrowApplicationError({
    page,
    box,
    pageCount: redaction.pageCount,
  });
  return redaction;
}

/** JSON TEXT only updates when we assign a new array, not when we mutate in place. */
export async function saveRedactionBoundingBoxes({
  key,
  redaction,
  redactionBoundingBoxes,
}: {
  key: string;
  redaction: MutationRedaction;
  redactionBoundingBoxes: RedactionBoundingBox[];
}): Promise<GetRedactionResponse> {
  // JSON TEXT only updates when we set the field, not when we mutate in place.
  // eslint-disable-next-line no-param-reassign
  redaction.redactionBoundingBoxes = redactionBoundingBoxes;
  await redaction.save();
  return getRedaction({ key });
}

/** First box with the same type, page, and coordinates. */
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
