"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const no_unexported_underscore_functions_1 = __importDefault(require("./no-unexported-underscore-functions"));
const ruleTester_1 = __importDefault(require("./ruleTester"));
ruleTester_1.default.run('no-unexported-underscore-functions', no_unexported_underscore_functions_1.default, {
    valid: [
        'function privateFunction() {}',
        'const privateFunction = () => {}',
        'export function _testHelper() {}',
        'export const _testHelper = () => {}',
    ],
    invalid: [
        {
            code: 'function _privateFunction() {}',
            errors: [{ messageId: 'noUnexportedUnderscoreFunction' }],
        },
        {
            code: 'const _privateFunction = () => {}',
            errors: [{ messageId: 'noUnexportedUnderscoreFunction' }],
        },
    ],
});
