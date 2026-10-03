import { ApplicationError } from '../../../../lib/errors/applicationError';
import { PartialInstance } from '../../../../lib/db/types';
import Redaction, {
  RedactionAttributes,
} from '../../../../lib/models/Redaction';
import { RedactionStatus } from '../../../../lib/redaction/redactionTypes';
import { getUnreachableError } from '../../../../lib/typescript/getUnreachableError';

/**
 * Lookup options. `attributes` lists the columns we select so TypeScript
 * knows which fields the returned instance has.
 */
interface FindRedactionByKeyOrErrorProps<
  Attrs extends keyof RedactionAttributes,
> {
  key: string;
  attributes: Attrs[];
}

/**
 * Look up a redaction by its public URL key.
 *
 * Callers pass `attributes` so the returned instance only types the columns
 * we actually selected. For example `{ attributes: ['status', 'pageCount'] }`
 * is a `PartialInstance` of those two fields.
 */
export async function findRedactionByKeyOrError<
  Attrs extends keyof RedactionAttributes,
>({
  key,
  attributes,
}: FindRedactionByKeyOrErrorProps<Attrs>): Promise<
  PartialInstance<RedactionAttributes, Attrs>
> {
  const redaction = await (Redaction.findOne({
    where: { key },
    attributes,
  }) as Promise<PartialInstance<RedactionAttributes, Attrs> | null>);

  if (!redaction) {
    throw new ApplicationError('We could not find this redaction.', 404);
  }

  return redaction;
}

/**
 * Review edits and download only make sense after processing finished.
 *
 * GET polling must not use this — it needs to return while status is still
 * `redacting`.
 */
export function assertIsRedactedOrThrowApplicationError(redaction: {
  status: RedactionStatus;
}): void {
  switch (redaction.status) {
    case RedactionStatus.redacting:
      throw new ApplicationError(
        'This redaction is still being processed. Please try again later.',
        409
      );
    case RedactionStatus.error:
      throw new ApplicationError(
        'This redaction encountered an error and is not ready.',
        409
      );
    case RedactionStatus.redacted:
      return;
    default:
      throw getUnreachableError(redaction.status);
  }
}
