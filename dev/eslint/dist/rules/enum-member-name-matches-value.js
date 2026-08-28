"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const util_1 = require("../util");
/**
 * Keeps machine-readable string enum member names and values identical so enum
 * members can be referenced consistently without a casing translation. Human-
 * readable labels such as `"United States"` are intentionally left alone.
 */
exports.default = (0, util_1.createRule)({
    name: 'enum-member-name-matches-value',
    defaultOptions: [],
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Require machine-readable string enum member names to match their values.',
            requiresTypeChecking: false,
        },
        messages: {
            enumMemberNameMatchesValue: "Machine-readable enum member '{{memberName}}' should use the same string for its value instead of '{{value}}'.",
        },
        schema: [],
    },
    create(context) {
        return {
            TSEnumMember(node) {
                if (node.id.type !== utils_1.AST_NODE_TYPES.Identifier ||
                    node.initializer?.type !== utils_1.AST_NODE_TYPES.Literal ||
                    typeof node.initializer.value !== 'string' ||
                    !isMachineReadableValue(node.initializer.value) ||
                    node.id.name === node.initializer.value) {
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
function isMachineReadableValue(value) {
    return /^[a-z][A-Za-z0-9]*(?:[-_][A-Za-z0-9]+)*$/.test(value);
}
