import path from 'path';
import rule, {
  RestrictedImportNeedsClientDirectiveRuleOptions,
} from './restrictedImportNeedsClientDirective';
import ruleTester from './ruleTester';

const restrictedOptions: [RestrictedImportNeedsClientDirectiveRuleOptions] = [
  {
    paths: [
      {
        name: '@mantine/hooks',
        importNames: ['useMediaQuery'],
      },
    ],
  },
];

ruleTester.run('restricted-import-needs-client-directive', rule, {
  valid: [
    {
      filename: path.join(process.cwd(), 'app/page.tsx'),
      options: restrictedOptions,
      code: `
'use client';

import { useMediaQuery } from '@mantine/hooks';

const active = useMediaQuery('(min-width: 1px)');
`,
    },
    {
      filename: path.join(process.cwd(), 'components/Card.tsx'),
      options: restrictedOptions,
      code: `
const label = 'hello';
`,
    },
  ],
  invalid: [
    {
      filename: path.join(process.cwd(), 'app/use-media.tsx'),
      options: restrictedOptions,
      code: `
import { useMediaQuery } from '@mantine/hooks';

const isWide = useMediaQuery('(min-width: 500px)');
`,
      errors: [
        {
          messageId: 'restrictedImportNeedsClientDirective',
          data: {
            importName: 'useMediaQuery',
            importSource: '@mantine/hooks',
          },
        },
      ],
    },
    {
      filename: path.join(process.cwd(), 'components/use-media.tsx'),
      options: restrictedOptions,
      code: `
import { useMediaQuery as mq } from '@mantine/hooks';

const isWide = mq('(min-width: 500px)');
`,
      errors: [
        {
          messageId: 'restrictedImportNeedsClientDirective',
          data: {
            importName: 'useMediaQuery',
            importSource: '@mantine/hooks',
          },
        },
      ],
    },
  ],
});
