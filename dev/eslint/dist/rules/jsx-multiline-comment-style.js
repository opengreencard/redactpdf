"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const util_1 = require("../util");
/**
 * Keeps multiline JSX comments consistent with the repository's preferred
 * comment syntax: line comments inside an empty JSX expression container.
 */
exports.default = (0, util_1.createRule)({
    name: 'jsx-multiline-comment-style',
    defaultOptions: [],
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Prefer line comments inside multiline JSX comment containers.',
            requiresTypeChecking: false,
        },
        messages: {
            useLineComments: 'Use line comments inside multiline JSX comments, for example `{\\n  // explanation\\n}`.',
        },
        schema: [],
    },
    create(context) {
        const sourceCode = context.getSourceCode();
        return {
            JSXExpressionContainer(node) {
                if (node.expression.type !== utils_1.AST_NODE_TYPES.JSXEmptyExpression) {
                    return;
                }
                for (const comment of sourceCode.getCommentsInside(node)) {
                    if (comment.type === 'Block' &&
                        comment.loc.start.line !== comment.loc.end.line) {
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
