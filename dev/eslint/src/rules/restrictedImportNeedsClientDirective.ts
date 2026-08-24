import { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../util';

const defaultRuleOptions: RestrictedImportNeedsClientDirectiveRuleOptions = {
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
export default createRule({
  name: 'restricted-imports-needs-client-directive',
  defaultOptions: [defaultRuleOptions],
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require the "use client" directive for file-level usage of restricted imports.',
      requiresTypeChecking: false,
    },
    messages: {
      restrictedImportNeedsClientDirective:
        'Import "{{importName}}" from "{{importSource}}" requires "use client" at the top of the file.',
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
  create(
    context: TSESLint.RuleContext<
      MessageIds,
      [RestrictedImportNeedsClientDirectiveRuleOptions]
    >
  ) {
    const options = context.options[0] ?? defaultRuleOptions;
    const sourceRestrictions = buildSourceRestrictions(options.paths);
    const flaggedNodes: FlaggedNode[] = [];

    let hasUseClientDirective = false;

    /**
     * Registers one forbidden named import if it appears in the rule map.
     *
     * Example:
     * - rule path `{ name: 'pkg', importNames: ['danger'] }`
     * - import statement `import { danger } from 'pkg';`
     * -> registers the `danger` import for reporting.
     */
    function registerRestrictedImport(
      source: string,
      importName: string,
      node: TSESTree.ImportSpecifier
    ): void {
      if (
        !hasRestriction({
          restrictions: sourceRestrictions,
          source,
          importName,
        })
      ) {
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
      Program(node: TSESTree.Program) {
        const firstStatement = node.body[0];
        hasUseClientDirective =
          firstStatement?.type === 'ExpressionStatement' &&
          firstStatement.directive === 'use client';
      },

      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const source = String(node.source.value);
        if (!sourceRestrictions.has(source)) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier'
          ) {
            registerRestrictedImport(
              source,
              specifier.imported.name,
              specifier
            );
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
 * Path-level restriction from the rule config.
 *
 * Example:
 * `{ name: 'lodash', importNames: ['get', 'set'] }`
 * means `lodash` imports named `get` or `set` are restricted in server files.
 * e.g., import { get, set } from 'lodash';
 */
export interface PathRestriction {
  name: string;
  importNames: string[];
}

/**
 * Full rule options object expected by ESLint.
 *
 * Example:
 * `{ paths: [{ name: 'example', importNames: ['expensive'] }] }`
 */
export interface RestrictedImportNeedsClientDirectiveRuleOptions {
  paths: PathRestriction[];
}

type MessageIds = 'restrictedImportNeedsClientDirective';

/**
 * Small payload for reporting: what import triggered the rule.
 * e.g., { importName: 'expensive', importSource: 'lodash' } for
 * import { expensive } from 'lodash';
 */
interface RestrictedImport {
  importName: string;
  importSource: string;
}

/**
 * Stores each matching restricted import node for deferred reporting at
 * `Program:exit`.
 */
interface FlaggedNode {
  node: TSESTree.Node;
  import: RestrictedImport;
}

/**
 * Builds a fast lookup map from package name to restricted import names:
 * converts from the user-facing `paths` array to the internal `restrictions`
 * map.
 *
 * Example:
 * `[ { name: 'pkg', importNames: ['a', 'b'] } ]`
 * becomes `Map { 'pkg' => ['a','b'] }`.s
 */
function buildSourceRestrictions(
  paths: PathRestriction[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();

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
function hasRestriction({
  restrictions,
  source,
  importName,
}: {
  restrictions: Map<string, string[]>;
  source: string;
  importName: string;
}): boolean {
  const names = restrictions.get(source);
  if (!names) return false;

  return names.length === 0 || names.includes(importName);
}
