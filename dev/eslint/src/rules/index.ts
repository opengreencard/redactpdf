import restrictedImportsNeedsClientDirective from './restrictedImportNeedsClientDirective';
import enumMemberNameMatchesValue from './enum-member-name-matches-value';
import noImportReexport from './no-import-reexport';
import requireFindByPkAttributes from './require-find-by-pk-attributes';
import requireSequelizeTypeAssertion from './require-sequelize-type-assertion';

// Disable warning about explicitly typing objects: in this case, having
// inferred keys is better
// eslint-disable-next-line no-restricted-syntax
export const rules = {
  'restricted-imports-needs-client-directive':
    restrictedImportsNeedsClientDirective,
  'enum-member-name-matches-value': enumMemberNameMatchesValue,
  'no-import-reexport': noImportReexport,
  'require-find-by-pk-attributes': requireFindByPkAttributes,
  'require-sequelize-type-assertion': requireSequelizeTypeAssertion,
};
