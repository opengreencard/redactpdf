"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_multiline_comment_style_1 = __importDefault(require("./jsx-multiline-comment-style"));
const ruleTester_1 = __importDefault(require("./ruleTester"));
ruleTester_1.default.run('jsx-multiline-comment-style', jsx_multiline_comment_style_1.default, {
    valid: [
        `
      const Component = () => <div>{/* one-line comment */}</div>;
    `,
        `
      const Component = () => (
        <div>
          {
            // explain the layout
            // without changing the rendered output
          }
        </div>
      );
    `,
        `
      /* Ordinary JavaScript block comments remain valid. */
      const value = 1;
    `,
    ],
    invalid: [
        {
            code: `
        const Component = () => (
          <div>
            {/* explain the layout
             * without changing the rendered output */}
          </div>
        );
      `,
            errors: [{ messageId: 'useLineComments' }],
        },
        {
            code: `
        const Component = () => (
          <div>
            {/*
             * explain the layout
             */}
          </div>
        );
      `,
            errors: [{ messageId: 'useLineComments' }],
        },
    ],
});
