import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../util';

const reportableDefTypes = new Set([
  'ClassName',
  'FunctionName',
  'TSEnumName',
  'Variable',
]);

/**
 * Prefer `export const { put: putX } = makeStorageFunctions(...)` (or
 * `export const putX = ...`) over declaring a binding and later
 * `export { putX }`.
 *
 * `no-restricted-syntax` cannot tell whether the name was declared in this
 * scope. We look up the same-scope variable and skip imports, which
 * `no-import-reexport` already covers.
 */
export default createRule({
  name: 'prefer-inline-export',
  defaultOptions: [],
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Export a local binding where it is declared instead of a later export list.',
      requiresTypeChecking: false,
    },
    messages: {
      preferInlineExport:
        'Export this binding where it is declared, e.g. `export const { put: putX } = makeStorageFunctions(...)` or `export const putX = ...`.',
    },
    schema: [],
  },
  create(context: TSESLint.RuleContext<'preferInlineExport', []>) {
    return {
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        if (node.source || node.exportKind === 'type') {
          return;
        }

        const scope = context.getSourceCode().getScope(node);
        for (const specifier of node.specifiers) {
          if (specifier.exportKind === 'type') {
            continue;
          }

          const variable = scope.set.get(specifier.local.name);
          if (
            variable?.defs.some(
              (def) =>
                reportableDefTypes.has(def.type) &&
                !isDeclaredWithExport(def.node)
            )
          ) {
            context.report({
              node: specifier,
              messageId: 'preferInlineExport',
            });
          }
        }
      },
    };
  },
});

function isDeclaredWithExport(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.ExportNamedDeclaration ||
      current.type === AST_NODE_TYPES.ExportDefaultDeclaration
    ) {
      return true;
    }
    if (
      current.type === AST_NODE_TYPES.Program ||
      current.type === AST_NODE_TYPES.BlockStatement
    ) {
      return false;
    }
    current = current.parent;
  }
  return false;
}
