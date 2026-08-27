import restrictedImportsNeedsClientDirective from './restrictedImportNeedsClientDirective';
import enumMemberNameMatchesValue from './enum-member-name-matches-value';
import jsxMultilineCommentStyle from './jsx-multiline-comment-style';
import noImportReexport from './no-import-reexport';
import noUnexportedUnderscoreFunctions from './no-unexported-underscore-functions';
import requireFindByPkAttributes from './require-find-by-pk-attributes';
import requireSequelizeTypeAssertion from './require-sequelize-type-assertion';

// Disable warning about explicitly typing objects: in this case, having
// inferred keys is better
// eslint-disable-next-line no-restricted-syntax
export const rules = {
  'restricted-imports-needs-client-directive':
    restrictedImportsNeedsClientDirective,
  'enum-member-name-matches-value': enumMemberNameMatchesValue,
  'jsx-multiline-comment-style': jsxMultilineCommentStyle,
  'no-import-reexport': noImportReexport,
  'no-unexported-underscore-functions': noUnexportedUnderscoreFunctions,
  'require-find-by-pk-attributes': requireFindByPkAttributes,
  'require-sequelize-type-assertion': requireSequelizeTypeAssertion,
};
