import rule from './no-unexported-underscore-functions';
import ruleTester from './ruleTester';

ruleTester.run('no-unexported-underscore-functions', rule, {
  valid: [
    'function privateFunction() {}',
    'const privateFunction = () => {}',
    'export function _testHelper() {}',
    'export const _testHelper = () => {}',
  ],
  invalid: [
    {
      code: 'function _privateFunction() {}',
      errors: [{ messageId: 'noUnexportedUnderscoreFunction' }],
    },
    {
      code: 'const _privateFunction = () => {}',
      errors: [{ messageId: 'noUnexportedUnderscoreFunction' }],
    },
  ],
});
