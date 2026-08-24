import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../util';

/**
 * Keeps machine-readable string enum member names and values identical so enum
 * members can be referenced consistently without a casing translation. Human-
 * readable labels such as `"United States"` are intentionally left alone.
 */
export default createRule({
  name: 'enum-member-name-matches-value',
  defaultOptions: [],
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require machine-readable string enum member names to match their values.',
      requiresTypeChecking: false,
    },
    messages: {
      enumMemberNameMatchesValue:
        "Machine-readable enum member '{{memberName}}' should use the same string for its value instead of '{{value}}'.",
    },
    schema: [],
  },
  create(context) {
    return {
      TSEnumMember(node: TSESTree.TSEnumMember) {
        if (
          node.id.type !== AST_NODE_TYPES.Identifier ||
          node.initializer?.type !== AST_NODE_TYPES.Literal ||
          typeof node.initializer.value !== 'string' ||
          !isMachineReadableValue(node.initializer.value) ||
          node.id.name === node.initializer.value
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'enumMemberNameMatchesValue',
          data: {
            memberName: node.id.name,
            value: node.initializer.value,
          },
        });
      },
    };
  },
});

function isMachineReadableValue(value: string): boolean {
  return /^[a-z][A-Za-z0-9]*(?:[-_][A-Za-z0-9]+)*$/.test(value);
}
