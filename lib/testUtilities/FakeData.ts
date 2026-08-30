import Redaction, {
  generateRedactionKey,
  RedactionCreationAttributes,
} from '../models/Redaction';
import { PageSize, RedactionStatus } from '../models/redactionTypes';
import { RequiredWithUndefined } from '../typescript/requiredWithUndefined';

// Keep the builder collection inferred so its public keys stay synchronized
// with the builders defined in this module.
// eslint-disable-next-line no-restricted-syntax
const FakeData = {
  makeDBRedaction,
};

export default FakeData;

/**
 * Create a database redaction row with sensible test defaults.
 *
 * Finished (`redacted`) rows need one size per page so getRedaction can return
 * them. Callers only pass `pageSizes` when they are testing a missing or
 * non-default size; `pageSizes: null` still wins over the redacted default.
 */
async function makeDBRedaction(
  options: Partial<RedactionCreationAttributes> = {}
) {
  const status = options.status ?? RedactionStatus.redacting;
  const pageCount = options.pageCount ?? 1;
  const creationAttributes: RequiredWithUndefined<RedactionCreationAttributes> =
    {
      id: options.id,
      key: options.key ?? generateRedactionKey(),
      pageCount,
      pageSizes:
        options.pageSizes !== undefined
          ? options.pageSizes
          : defaultPageSizesForStatus({ status, pageCount }),
      redactionBoundingBoxes: options.redactionBoundingBoxes ?? [],
      status,
      errorMessage: options.errorMessage ?? null,
    };

  return Redaction.create(creationAttributes);
}

function defaultPageSizesForStatus({
  status,
  pageCount,
}: {
  status: RedactionStatus;
  pageCount: number;
}): PageSize[] | null {
  if (status !== RedactionStatus.redacted) {
    return null;
  }
  return Array.from({ length: pageCount }, (): PageSize => ({
    width: defaultPageWidth,
    height: defaultPageHeight,
  }));
}

// Match ClientFakeData.makePageSize so tests that omit pageSizes still get
// the same raster size the vision pipeline uses for letter pages.
const defaultPageWidth = 1275;
const defaultPageHeight = 1650;
