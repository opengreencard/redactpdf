import rule from './prefer-inline-export';
import ruleTester from './ruleTester';

ruleTester.run('prefer-inline-export', rule, {
  valid: [
    'export const putX = 1',
    'export function putX() {}',
    'export class PutX {}',
    `
      export const {
        put: putRedactionFile,
      } = makeStorageFunctions();
    `,
    `
      import { putRedactionFile } from './redactionFile';
      export { putRedactionFile };
    `,
    `
      const putRedactionFile = 1;
      function inner() {
        const putRedactionFile = 2;
        return putRedactionFile;
      }
    `,
  ],
  invalid: [
    {
      code: `
        const {
          put: putRedactionFile,
        } = makeStorageFunctions();
        export { putRedactionFile };
      `,
      errors: [{ messageId: 'preferInlineExport' }],
    },
    {
      code: `
        const putRedactionFile = 1;
        export { putRedactionFile };
      `,
      errors: [{ messageId: 'preferInlineExport' }],
    },
    {
      code: `
        function putRedactionFile() {}
        export { putRedactionFile };
      `,
      errors: [{ messageId: 'preferInlineExport' }],
    },
    {
      code: `
        const { a, b } = foo();
        export { a, b };
      `,
      errors: [
        { messageId: 'preferInlineExport' },
        { messageId: 'preferInlineExport' },
      ],
    },
  ],
});
