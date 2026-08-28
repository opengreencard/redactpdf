"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const ruleTester = new utils_1.TSESLint.RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
        ecmaFeatures: {
            jsx: true,
        },
    },
});
exports.default = ruleTester;
