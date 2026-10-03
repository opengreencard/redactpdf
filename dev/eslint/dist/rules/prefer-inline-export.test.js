"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prefer_inline_export_1 = __importDefault(require("./prefer-inline-export"));
const ruleTester_1 = __importDefault(require("./ruleTester"));
ruleTester_1.default.run('prefer-inline-export', prefer_inline_export_1.default, {
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
