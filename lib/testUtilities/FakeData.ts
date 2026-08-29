import Redaction, {
  generateRedactionKey,
  RedactionCreationAttributes,
} from '../models/Redaction';
import { RedactionStatus } from '../models/redactionTypes';
import { RequiredWithUndefined } from '../typescript/requiredWithUndefined';

// Keep the builder collection inferred so its public keys stay synchronized
// with the builders defined in this module.
// eslint-disable-next-line no-restricted-syntax
const FakeData = {
  makeDBRedaction,
};

export default FakeData;

/** Create a database redaction row with sensible test defaults. */
async function makeDBRedaction(
  options: Partial<RedactionCreationAttributes> = {}
) {
  const creationAttributes: RequiredWithUndefined<RedactionCreationAttributes> =
    {
      id: options.id,
      key: options.key ?? generateRedactionKey(),
      pageCount: options.pageCount ?? 1,
      pageSizes: options.pageSizes ?? null,
      redactionBoundingBoxes: options.redactionBoundingBoxes ?? [],
      status: options.status ?? RedactionStatus.redacting,
      errorMessage: options.errorMessage ?? null,
    };

  return Redaction.create(creationAttributes);
}
