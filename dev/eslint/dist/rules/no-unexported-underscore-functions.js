"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const util_1 = require("../util");
/** Require underscore-prefixed functions to be explicitly exported for tests. */
exports.default = (0, util_1.createRule)({
    name: 'no-unexported-underscore-functions',
    defaultOptions: [],
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow underscore-prefixed functions that are not exported.',
            requiresTypeChecking: false,
        },
        messages: {
            noUnexportedUnderscoreFunction: 'Underscore-prefixed functions must be exported, or use a non-underscored name for a private function.',
        },
        schema: [],
    },
    create(context) {
        return {
            FunctionDeclaration(node) {
                if (node.id &&
                    isUnderscorePrefixed(node.id.name) &&
                    !isExported(node)) {
                    context.report({
                        node: node.id,
                        messageId: 'noUnexportedUnderscoreFunction',
                    });
                }
            },
            VariableDeclarator(node) {
                if (node.id.type === utils_1.AST_NODE_TYPES.Identifier &&
                    isUnderscorePrefixed(node.id.name) &&
                    isFunctionExpression(node.init) &&
                    !isExported(node)) {
                    context.report({
                        node: node.id,
                        messageId: 'noUnexportedUnderscoreFunction',
                    });
                }
            },
        };
    },
});
function isUnderscorePrefixed(name) {
    return name.startsWith('_');
}
function isFunctionExpression(node) {
    return (node?.type === utils_1.AST_NODE_TYPES.ArrowFunctionExpression ||
        node?.type === utils_1.AST_NODE_TYPES.FunctionExpression);
}
function isExported(node) {
    const { parent } = node;
    if (parent.type === utils_1.AST_NODE_TYPES.ExportNamedDeclaration ||
        parent.type === utils_1.AST_NODE_TYPES.ExportDefaultDeclaration) {
        return true;
    }
    return (parent.type === utils_1.AST_NODE_TYPES.VariableDeclaration &&
        (parent.parent.type === utils_1.AST_NODE_TYPES.ExportNamedDeclaration ||
            parent.parent.type === utils_1.AST_NODE_TYPES.ExportDefaultDeclaration));
}
