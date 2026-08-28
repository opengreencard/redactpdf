"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const defaultRuleOptions = {
    paths: [],
};
/**
 * Enforces that files using forbidden imports declare `"use client"` at the top.
 *
 * Step-by-step:
 * 1. Detect whether the file has `"use client"` as the first directive.
 * 2. Build a lookup of restricted module paths and named imports.
 * 3. Collect forbidden named imports found in import declarations.
 * 4. On `Program:exit`, report one error only if the file is missing the directive.
 */
exports.default = (0, util_1.createRule)({
    name: 'restricted-imports-needs-client-directive',
    defaultOptions: [defaultRuleOptions],
    meta: {
        type: 'problem',
        docs: {
            description: 'Require the "use client" directive for file-level usage of restricted imports.',
            requiresTypeChecking: false,
        },
        messages: {
            restrictedImportNeedsClientDirective: 'Import "{{importName}}" from "{{importSource}}" requires "use client" at the top of the file.',
        },
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    paths: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['name'],
                            additionalProperties: false,
                            properties: {
                                name: { type: 'string' },
                                importNames: {
                                    type: 'array',
                                    items: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
    create(context) {
        const options = context.options[0] ?? defaultRuleOptions;
        const sourceRestrictions = buildSourceRestrictions(options.paths);
        const flaggedNodes = [];
        let hasUseClientDirective = false;
        /**
         * Registers one forbidden named import if it appears in the rule map.
         *
         * Example:
         * - rule path `{ name: 'pkg', importNames: ['danger'] }`
         * - import statement `import { danger } from 'pkg';`
         * -> registers the `danger` import for reporting.
         */
        function registerRestrictedImport(source, importName, node) {
            if (!hasRestriction({
                restrictions: sourceRestrictions,
                source,
                importName,
            })) {
                return;
            }
            flaggedNodes.push({
                node,
                import: {
                    importName,
                    importSource: source,
                },
            });
        }
        return {
            Program(node) {
                const firstStatement = node.body[0];
                hasUseClientDirective =
                    firstStatement?.type === 'ExpressionStatement' &&
                        firstStatement.directive === 'use client';
            },
            ImportDeclaration(node) {
                const source = String(node.source.value);
                if (!sourceRestrictions.has(source)) {
                    return;
                }
                for (const specifier of node.specifiers) {
                    if (specifier.type === 'ImportSpecifier' &&
                        specifier.imported.type === 'Identifier') {
                        registerRestrictedImport(source, specifier.imported.name, specifier);
                    }
                }
            },
            'Program:exit': function handleProgramExit() {
                if (hasUseClientDirective || flaggedNodes.length === 0) {
                    return;
                }
                const firstFlag = flaggedNodes[0];
                context.report({
                    node: firstFlag.node,
                    messageId: 'restrictedImportNeedsClientDirective',
                    data: {
                        importName: firstFlag.import.importName,
                        importSource: firstFlag.import.importSource,
                    },
                });
            },
        };
    },
});
/**
 * Builds a fast lookup map from package name to restricted import names:
 * converts from the user-facing `paths` array to the internal `restrictions`
 * map.
 *
 * Example:
 * `[ { name: 'pkg', importNames: ['a', 'b'] } ]`
 * becomes `Map { 'pkg' => ['a','b'] }`.s
 */
function buildSourceRestrictions(paths) {
    const map = new Map();
    for (const restriction of paths) {
        map.set(restriction.name, restriction.importNames ?? []);
    }
    return map;
}
/**
 * Checks if a given named import is restricted for a source module.
 *
 * Why empty arrays are useful:
 * if a path restriction has no import names, `[]` means "all named imports".
 * That lets teams enforce client-side usage for entire modules in one place.
 */
function hasRestriction({ restrictions, source, importName, }) {
    const names = restrictions.get(source);
    if (!names)
        return false;
    return names.length === 0 || names.includes(importName);
}
