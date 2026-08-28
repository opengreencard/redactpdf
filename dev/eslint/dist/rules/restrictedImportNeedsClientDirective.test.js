"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const restrictedImportNeedsClientDirective_1 = __importDefault(require("./restrictedImportNeedsClientDirective"));
const ruleTester_1 = __importDefault(require("./ruleTester"));
const restrictedOptions = [
    {
        paths: [
            {
                name: '@mantine/hooks',
                importNames: ['useMediaQuery'],
            },
        ],
    },
];
ruleTester_1.default.run('restricted-import-needs-client-directive', restrictedImportNeedsClientDirective_1.default, {
    valid: [
        {
            filename: path_1.default.join(process.cwd(), 'app/page.tsx'),
            options: restrictedOptions,
            code: `
'use client';

import { useMediaQuery } from '@mantine/hooks';

const active = useMediaQuery('(min-width: 1px)');
`,
        },
        {
            filename: path_1.default.join(process.cwd(), 'components/Card.tsx'),
            options: restrictedOptions,
            code: `
const label = 'hello';
`,
        },
    ],
    invalid: [
        {
            filename: path_1.default.join(process.cwd(), 'app/use-media.tsx'),
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
            filename: path_1.default.join(process.cwd(), 'components/use-media.tsx'),
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
