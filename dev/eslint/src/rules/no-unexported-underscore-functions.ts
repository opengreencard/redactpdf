import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../util';

/** Require underscore-prefixed functions to be explicitly exported for tests. */
export default createRule({
  name: 'no-unexported-underscore-functions',
  defaultOptions: [],
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow underscore-prefixed functions that are not exported.',
      requiresTypeChecking: false,
    },
    messages: {
      noUnexportedUnderscoreFunction:
        'Underscore-prefixed functions must be exported, or use a non-underscored name for a private function.',
    },
    schema: [],
  },
  create(context) {
    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        if (
          node.id &&
          isUnderscorePrefixed(node.id.name) &&
          !isExported(node)
        ) {
          context.report({
            node: node.id,
            messageId: 'noUnexportedUnderscoreFunction',
          });
        }
      },
      VariableDeclarator(node: TSESTree.VariableDeclarator) {
        if (
          node.id.type === AST_NODE_TYPES.Identifier &&
          isUnderscorePrefixed(node.id.name) &&
          isFunctionExpression(node.init) &&
          !isExported(node)
        ) {
          context.report({
            node: node.id,
            messageId: 'noUnexportedUnderscoreFunction',
          });
        }
      },
    };
  },
});

function isUnderscorePrefixed(name: string): boolean {
  return name.startsWith('_');
}

function isFunctionExpression(
  node: TSESTree.Expression | null
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression {
  return (
    node?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node?.type === AST_NODE_TYPES.FunctionExpression
  );
}

function isExported(
  node: TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator
): boolean {
  const { parent } = node;
  if (
    parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    parent.type === AST_NODE_TYPES.ExportDefaultDeclaration
  ) {
    return true;
  }

  return (
    parent.type === AST_NODE_TYPES.VariableDeclaration &&
    (parent.parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
      parent.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration)
  );
}
