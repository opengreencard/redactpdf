import rule from './jsx-multiline-comment-style';
import ruleTester from './ruleTester';

ruleTester.run('jsx-multiline-comment-style', rule, {
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
