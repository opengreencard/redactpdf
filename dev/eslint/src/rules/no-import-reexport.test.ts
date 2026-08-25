import rule from './no-import-reexport';
import ruleTester from './ruleTester';

ruleTester.run('no-import-reexport', rule, {
  valid: [
    'export const X = 1',
    'export function Y() {}',
    `
      import { X } from './path';
      const value = X;
    `,
    `
      import type { UploadResponse } from './api';
      export const upload = (response: UploadResponse) => response;
    `,
    `
      const { putObject } = makeStorageFunctions();
      export { putObject };
    `,
    {
      code: `
        import { X } from './path';
        export { X };
      `,
      filename: '/some/path/index.ts',
    },
    {
      code: `
        import type { X } from './path';
        export type { X };
      `,
      filename: '/some/path/index.tsx',
    },
    {
      code: `
        import Foo from './path';
        export default Foo;
      `,
      filename: '/some/path/types.d.ts',
    },
    // Next.js app-router pages import a component and re-export it as default.
    {
      code: `
        import LandingPage from './LandingPage';
        export default LandingPage;
      `,
      filename: '/some/path/app/page.tsx',
    },
    {
      code: `
        import { LandingPage } from './LandingPage';
        export default LandingPage;
      `,
      filename: '/some/path/app/page.tsx',
    },
  ],
  invalid: [
    {
      code: `
        import { X } from './path';
        export { X };
      `,
      filename: '/some/path/file.ts',
      errors: [{ messageId: 'noImportReexport' }],
    },
    {
      code: `
        import type { UploadResponse } from './api';
        export type { UploadResponse };
      `,
      filename: '/some/path/file.ts',
      errors: [{ messageId: 'noImportReexport' }],
    },
    {
      code: `
        import { X as LocalX } from './path';
        export { LocalX };
      `,
      filename: '/some/path/file.ts',
      errors: [{ messageId: 'noImportReexport' }],
    },
    {
      code: `
        import { X } from './path1';
        import { Y } from './path2';
        export { X, Y };
      `,
      filename: '/some/path/file.ts',
      errors: [
        { messageId: 'noImportReexport' },
        { messageId: 'noImportReexport' },
      ],
    },
  ],
});
