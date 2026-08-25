import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../util';

/**
 * Flags `import { X } from '...'` followed by `export { X }` (or `export type { X }`)
 * in the same file. Canonical `export { X } from '...'` is covered separately by
 * `no-restricted-syntax`.
 *
 * `export default` is allowed: Next.js app-router pages commonly import a page
 * component and re-export it as the route default.
 */
export default createRule({
  name: 'no-import-reexport',
  defaultOptions: [],
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow named re-exports of symbols that were imported in the same file. Default re-exports are allowed.',
      requiresTypeChecking: false,
    },
    messages: {
      noImportReexport:
        'Avoid re-exporting imported symbols. Import them from their canonical module, where they are declared, to keep the dependency path direct.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    if (isExceptionFile(filename)) {
      return {};
    }

    const importedLocalNames = new Set<string>();

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        for (const specifier of node.specifiers) {
          if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
            importedLocalNames.add(specifier.local.name);
          }
        }
      },

      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        if (node.source) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (importedLocalNames.has(specifier.local.name)) {
            context.report({
              node: specifier,
              messageId: 'noImportReexport',
            });
          }
        }
      },
    };
  },
});

/** Check if this file is an exception where re-exports are allowed. */
function isExceptionFile(filename: string): boolean {
  const normalizedFilename = filename.replace(/\\/g, '/');

  return (
    /\/index\.(ts|tsx|js|jsx)$/.test(normalizedFilename) ||
    /\.(native|web|ios|android)\.(ts|tsx)$/.test(normalizedFilename) ||
    /\.d\.ts$/.test(normalizedFilename)
  );
}
