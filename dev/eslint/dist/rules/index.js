"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rules = void 0;
const restrictedImportNeedsClientDirective_1 = __importDefault(require("./restrictedImportNeedsClientDirective"));
const enum_member_name_matches_value_1 = __importDefault(require("./enum-member-name-matches-value"));
const jsx_multiline_comment_style_1 = __importDefault(require("./jsx-multiline-comment-style"));
const no_import_reexport_1 = __importDefault(require("./no-import-reexport"));
const no_unexported_underscore_functions_1 = __importDefault(require("./no-unexported-underscore-functions"));
const require_find_by_pk_attributes_1 = __importDefault(require("./require-find-by-pk-attributes"));
const require_sequelize_type_assertion_1 = __importDefault(require("./require-sequelize-type-assertion"));
// Disable warning about explicitly typing objects: in this case, having
// inferred keys is better
// eslint-disable-next-line no-restricted-syntax
exports.rules = {
    'restricted-imports-needs-client-directive': restrictedImportNeedsClientDirective_1.default,
    'enum-member-name-matches-value': enum_member_name_matches_value_1.default,
    'jsx-multiline-comment-style': jsx_multiline_comment_style_1.default,
    'no-import-reexport': no_import_reexport_1.default,
    'no-unexported-underscore-functions': no_unexported_underscore_functions_1.default,
    'require-find-by-pk-attributes': require_find_by_pk_attributes_1.default,
    'require-sequelize-type-assertion': require_sequelize_type_assertion_1.default,
};
