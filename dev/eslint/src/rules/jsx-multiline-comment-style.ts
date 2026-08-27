import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../util';

/**
 * Keeps multiline JSX comments consistent with the repository's preferred
 * comment syntax: line comments inside an empty JSX expression container.
 */
export default createRule({
  name: 'jsx-multiline-comment-style',
  defaultOptions: [],
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer line comments inside multiline JSX comment containers.',
      requiresTypeChecking: false,
    },
    messages: {
      useLineComments:
        'Use line comments inside multiline JSX comments, for example `{\\n  // explanation\\n}`.',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.getSourceCode();

    return {
      JSXExpressionContainer(node: TSESTree.JSXExpressionContainer) {
        if (node.expression.type !== AST_NODE_TYPES.JSXEmptyExpression) {
          return;
        }

        for (const comment of sourceCode.getCommentsInside(node)) {
          if (
            comment.type === 'Block' &&
            comment.loc.start.line !== comment.loc.end.line
          ) {
            context.report({
              loc: comment.loc,
              messageId: 'useLineComments',
            });
          }
        }
      },
    };
  },
});
