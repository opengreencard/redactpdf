"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const util_1 = require("../util");
/**
 * Requires typed results when Sequelize queries select a subset of columns.
 *
 * A query with `attributes` can no longer safely be treated as a complete model
 * instance. The fixer expresses that subset with `PartialInstance` and keeps
 * Sequelize's nullable result for `findOne` and `findByPk`.
 */
exports.default = (0, util_1.createRule)({
    name: 'require-sequelize-type-assertion',
    defaultOptions: [],
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Require assertions for Sequelize queries with attributes.',
            requiresTypeChecking: false,
        },
        messages: {
            requireSequelizeTypeAssertion: 'To ensure safer type-checking, include a type assertion on the query to prevent runtime errors.',
        },
        schema: [],
        fixable: 'code',
    },
    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.type !== utils_1.AST_NODE_TYPES.MemberExpression ||
                    node.callee.property.type !== utils_1.AST_NODE_TYPES.Identifier ||
                    !['findAll', 'findOne', 'findByPk'].includes(node.callee.property.name)) {
                    return;
                }
                const objectArgument = node.arguments.find((argument) => argument.type === utils_1.AST_NODE_TYPES.ObjectExpression);
                const attributesProperty = objectArgument?.properties.find((property) => property.type === utils_1.AST_NODE_TYPES.Property &&
                    property.key.type === utils_1.AST_NODE_TYPES.Identifier &&
                    property.key.name === 'attributes');
                const hasIdentifierSpread = objectArgument?.properties.some((property) => property.type === utils_1.AST_NODE_TYPES.SpreadElement &&
                    property.argument.type === utils_1.AST_NODE_TYPES.Identifier);
                if (!attributesProperty && !hasIdentifierSpread)
                    return;
                const { parent } = node;
                const isAsserted = parent.type === utils_1.AST_NODE_TYPES.TSAsExpression ||
                    parent.type === utils_1.AST_NODE_TYPES.TSTypeAssertion ||
                    (parent.type === utils_1.AST_NODE_TYPES.AwaitExpression &&
                        (parent.parent?.type === utils_1.AST_NODE_TYPES.TSAsExpression ||
                            parent.parent?.type === utils_1.AST_NODE_TYPES.TSTypeAssertion));
                if (isAsserted)
                    return;
                context.report({
                    node,
                    messageId: 'requireSequelizeTypeAssertion',
                    fix: attributesProperty
                        ? (fixer) => buildFixes(context, fixer, node, attributesProperty)
                        : undefined,
                });
            },
        };
    },
});
function buildFixes(context, fixer, node, attributesProperty) {
    if (node.callee.type !== utils_1.AST_NODE_TYPES.MemberExpression ||
        node.callee.object.type !== utils_1.AST_NODE_TYPES.Identifier ||
        node.callee.property.type !== utils_1.AST_NODE_TYPES.Identifier) {
        return [];
    }
    const modelName = node.callee.object.name;
    const attributeNames = getAttributeNames(attributesProperty.value);
    if (attributeNames.length === 0)
        return [];
    const sourceCode = context.getSourceCode();
    const imports = sourceCode.ast.body.filter((statement) => statement.type === utils_1.AST_NODE_TYPES.ImportDeclaration);
    const modelImport = imports.find((declaration) => declaration.specifiers.some((specifier) => specifier.type === utils_1.AST_NODE_TYPES.ImportDefaultSpecifier &&
        specifier.local.name === modelName));
    if (!modelImport)
        return [];
    const fixes = [];
    const attributesName = `${modelName}Attributes`;
    const hasAttributesImport = imports.some((declaration) => declaration.specifiers.some((specifier) => specifier.type === utils_1.AST_NODE_TYPES.ImportSpecifier &&
        specifier.imported.type === utils_1.AST_NODE_TYPES.Identifier &&
        specifier.imported.name === attributesName));
    if (!hasAttributesImport) {
        fixes.push(fixer.insertTextBefore(modelImport, `import { ${attributesName} } from '${modelImport.source.value}';\n`));
    }
    const importPath = String(modelImport.source.value);
    const modelIndex = importPath.indexOf('/models');
    const hasPartialInstanceImport = imports.some((declaration) => declaration.specifiers.some((specifier) => specifier.type === utils_1.AST_NODE_TYPES.ImportSpecifier &&
        specifier.imported.type === utils_1.AST_NODE_TYPES.Identifier &&
        specifier.imported.name === 'PartialInstance'));
    if (!hasPartialInstanceImport && modelIndex !== -1) {
        fixes.push(fixer.insertTextBefore(modelImport, `import { PartialInstance } from '${importPath.slice(0, modelIndex)}/db/types';\n`));
    }
    const assertion = `PartialInstance<${attributesName}, ${attributeNames.join(' | ')}>`;
    const nullable = ['findOne', 'findByPk'].includes(node.callee.property.name)
        ? ` | null`
        : '[]';
    fixes.push(fixer.insertTextAfter(node, ` as ${assertion}${nullable}`));
    return fixes;
}
function getAttributeNames(value) {
    if (value.type === utils_1.AST_NODE_TYPES.Identifier) {
        return [`(typeof ${value.name})[number]`];
    }
    if (value.type === utils_1.AST_NODE_TYPES.Literal &&
        typeof value.value === 'string') {
        return [`'${value.value}'`];
    }
    if (value.type !== utils_1.AST_NODE_TYPES.ArrayExpression)
        return [];
    return value.elements.flatMap((element) => {
        if (element?.type === utils_1.AST_NODE_TYPES.Literal &&
            typeof element.value === 'string') {
            return [`'${element.value}'`];
        }
        if (element?.type === utils_1.AST_NODE_TYPES.SpreadElement &&
            element.argument.type === utils_1.AST_NODE_TYPES.Identifier) {
            return [`(typeof ${element.argument.name})[number]`];
        }
        return [];
    });
}
