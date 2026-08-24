import restrictedImportsNeedsClientDirective from './restrictedImportNeedsClientDirective';
import enumMemberNameMatchesValue from './enum-member-name-matches-value';
import requireSequelizeTypeAssertion from './require-sequelize-type-assertion';

// Disable warning about explicitly typing objects: in this case, having
// inferred keys is better
// eslint-disable-next-line no-restricted-syntax
export const rules = {
  'restricted-imports-needs-client-directive':
    restrictedImportsNeedsClientDirective,
  'enum-member-name-matches-value': enumMemberNameMatchesValue,
  'require-sequelize-type-assertion': requireSequelizeTypeAssertion,
};
