import rule from './enum-member-name-matches-value';
import ruleTester from './ruleTester';

ruleTester.run('enum-member-name-matches-value', rule, {
  valid: [
    {
      code: `
        enum EmailSendMode {
          dryRun = 'dryRun',
          send = 'send',
        }
      `,
    },
    {
      code: `
        enum NumericStatus {
          pending,
          sent,
        }
      `,
    },
    {
      code: `
        const value = 'send';
        enum DynamicValue {
          send = value,
        }
      `,
    },
  ],
  invalid: [
    {
      code: `
        enum EmailSendMode {
          dryRun = 'dry-run',
        }
      `,
      errors: [
        {
          messageId: 'enumMemberNameMatchesValue',
          data: { memberName: 'dryRun', value: 'dry-run' },
        },
      ],
    },
  ],
});
