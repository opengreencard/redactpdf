"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enum_member_name_matches_value_1 = __importDefault(require("./enum-member-name-matches-value"));
const ruleTester_1 = __importDefault(require("./ruleTester"));
ruleTester_1.default.run('enum-member-name-matches-value', enum_member_name_matches_value_1.default, {
    valid: [
        {
            code: `
        enum EmailSendMode {
          dryRun = 'dryRun',
          send = 'send',
        }
      `,
        },
        {
            code: `
        enum NumericStatus {
          pending,
          sent,
        }
      `,
        },
        {
            code: `
        const value = 'send';
        enum DynamicValue {
          send = value,
        }
      `,
        },
    ],
    invalid: [
        {
            code: `
        enum EmailSendMode {
          dryRun = 'dry-run',
        }
      `,
            errors: [
                {
                    messageId: 'enumMemberNameMatchesValue',
                    data: { memberName: 'dryRun', value: 'dry-run' },
                },
            ],
        },
    ],
});
