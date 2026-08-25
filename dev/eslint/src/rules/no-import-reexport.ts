import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../util';

/**
 * Flags `import { X } from '...'` followed by `export { X }` (or `export type { X }`)
 * in the same file. Canonical `export { X } from '...'` is covered separately by
 * `no-restricted-syntax`.
 */
export default createRule({
  name: 'no-import-reexport',
  defaultOptions: [],
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow re-exporting symbols that were imported in the same file.',
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
    let defaultImportLocalName: string | null = null;

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        for (const specifier of node.specifiers) {
          if (specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
            defaultImportLocalName = specifier.local.name;
            continue;
          }

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

      ExportDefaultDeclaration(node: TSESTree.ExportDefaultDeclaration) {
        if (
          node.declaration?.type === AST_NODE_TYPES.Identifier &&
          defaultImportLocalName === node.declaration.name
        ) {
          context.report({
            node: node.declaration,
            messageId: 'noImportReexport',
          });
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
