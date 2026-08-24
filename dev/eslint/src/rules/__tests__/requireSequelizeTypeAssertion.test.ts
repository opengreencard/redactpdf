import rule from '../require-sequelize-type-assertion';
import ruleTester from '../ruleTester';

ruleTester.run('require-sequelize-type-assertion', rule, {
  valid: [
    {
      code: `
        import User, { UserAttributes } from '@/lib/models/User';
        import { PartialInstance } from '@/lib/db/types';
        User.findAll({ attributes: ['id'] }) as PartialInstance<UserAttributes, 'id'>[];
      `,
    },
  ],
  invalid: [
    {
      code: "import User from '@/lib/models/User';\nUser.findAll({ attributes: ['id', 'email'] });",
      errors: [{ messageId: 'requireSequelizeTypeAssertion' }],
      output:
        "import { UserAttributes } from '@/lib/models/User';\nimport { PartialInstance } from '@/lib/db/types';\nimport User from '@/lib/models/User';\nUser.findAll({ attributes: ['id', 'email'] }) as PartialInstance<UserAttributes, 'id' | 'email'>[];",
    },
    {
      code: `
        import User, { UserAttributes } from '@/lib/models/User';
        import { PartialInstance } from '@/lib/db/types';
        const user = await User.findOne({ attributes: 'id' });
      `,
      errors: [{ messageId: 'requireSequelizeTypeAssertion' }],
      output: `
        import User, { UserAttributes } from '@/lib/models/User';
        import { PartialInstance } from '@/lib/db/types';
        const user = await User.findOne({ attributes: 'id' }) as PartialInstance<UserAttributes, 'id'> | null;
      `,
    },
    {
      code: `
        import User, { UserAttributes } from '@/lib/models/User';
        import { PartialInstance } from '@/lib/db/types';
        const attributes = ['id'] as const;
        const users = await User.findAll({ attributes });
      `,
      errors: [{ messageId: 'requireSequelizeTypeAssertion' }],
      output: `
        import User, { UserAttributes } from '@/lib/models/User';
        import { PartialInstance } from '@/lib/db/types';
        const attributes = ['id'] as const;
        const users = await User.findAll({ attributes }) as PartialInstance<UserAttributes, (typeof attributes)[number]>[];
      `,
    },
  ],
});
