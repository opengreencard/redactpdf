import { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../util';

/**
 * Requires an attributes option when querying with Sequelize to avoid
 * excessive database load.
 */
export default createRule({
  name: 'require-find-by-pk-attributes',
  defaultOptions: [],

  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Requires an attributes option when calling .findOne(), .findAll(), or .findByPk() to avoid excessive database load',
      requiresTypeChecking: false,
    },
    messages: {
      requireFindByPkAttributes:
        'Always pass an attributes option to .findOne(), .findAll(), or .findByPk() to avoid fetching all columns',
    },
    schema: [],
  },

  create(context) {
    return {
      CallExpression: (node: TSESTree.CallExpression) => {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          !['findAll', 'findByPk', 'findOne'].includes(
            node.callee.property.name
          )
        ) {
          return;
        }

        const optionsArgumentIndex =
          node.callee.property.name === 'findByPk' ? 1 : 0;
        const optionsArgument = node.arguments[optionsArgumentIndex];

        if (!optionsArgument || optionsArgument.type !== 'ObjectExpression') {
          context.report({
            node,
            messageId: 'requireFindByPkAttributes',
          });
          return;
        }

        const hasAttributes = optionsArgument.properties.some((property) => {
          if (property.type !== 'Property') {
            return false;
          }

          if (
            property.key.type === 'Identifier' &&
            property.key.name === 'attributes'
          ) {
            return true;
          }

          return (
            property.key.type === 'Literal' &&
            property.key.value === 'attributes'
          );
        });

        if (!hasAttributes) {
          context.report({
            node,
            messageId: 'requireFindByPkAttributes',
          });
        }
      },
    };
  },
});
