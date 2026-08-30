---
name: testdata-fixtures
description: >-
  Creates and maintains __testData__ JSON fixtures with test-data generator
  tests and typed index.ts exports.
---

# Test data fixtures (`__testData__`)

Use generated JSON for reusable data from a live API, database, or other
production-shaped source. Keep the generator and its generated files together:

```text
__testData__/<Name>/
  index.ts          # imports JSON and exports Test<Name>
  index.test.ts     # generates JSON with makeTestDataGeneratorTest
  Example.json
```

## Generate JSON

Add one `makeTestDataGeneratorTest` call per JSON file in `index.test.ts`.
The generator test is skipped by ordinary `yarn jest`, so it does not make
live or billed requests during regular test runs.

Run with development configuration by default:

```sh
yarn devdb-testdata-jest path/to/__testData__/<Name>/index.test.ts
```

Use production configuration only when the fixture must come from production
data:

```sh
yarn proddb-testdata-jest path/to/__testData__/<Name>/index.test.ts
```

Existing files are skipped. To intentionally refresh fixtures, use
`UPDATE=1`; use `UPDATE_PATTERN=Example.json` to refresh one matching file.
`APP_MODE` selects the corresponding environment file, and `TEST_TYPES`
enables the generator test type.

## Consume JSON

`index.ts` imports the generated JSON directly. Let the exported `TestXxx`
collection infer its shape; do not add an explicit `Record` or object type
annotation. Prefer `satisfies` when a JSON import retains the required literal
types; use a type assertion when JSON module inference widens enum-valued
fields:

```ts
import ExampleJSON from './Example.json';
import type { Example } from '../../../models/example';

export const TestExample: Example = ExampleJSON as Example;
```

Do not manually duplicate generated values in `index.ts`. For vision or API
responses, the generator should call the same application function used by
the feature so refreshing the fixture exercises that boundary.

## Other fixture rules

- Put module-specific fixtures in adjacent `__testData__/` folders.
- Use `FakeData` and `ClientFakeData` for in-memory application objects.
- Keep pass-through mock recordings under
  `__testData__/<mock-file-basename>/<function-name>/`.
- Add a README sidecar to every downloaded or third-party binary with its
  search terms, exact source URL, attribution, and retrieval date.
- Never commit real user documents or extracted personal information.
