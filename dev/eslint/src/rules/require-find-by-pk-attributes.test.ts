import rule from './require-find-by-pk-attributes';
import ruleTester from './ruleTester';

ruleTester.run('require-find-by-pk-attributes', rule, {
  valid: [
    'Model.findByPk(id, { attributes: ["id"] });',
    'Model.findByPk(id, { ["attributes"]: ["id"] });',
    'Model.findOne({ attributes: ["id"], where: { id } });',
    'Model.findAll({ attributes: ["id"], where: { id } });',
    'Model.findByPk(id, { attributes, ...restOptions });',
    'Model.findOne({ attributes, where: { id } });',
  ],
  invalid: [
    {
      code: 'Model.findByPk(id);',
      errors: [{ messageId: 'requireFindByPkAttributes' }],
    },
    {
      code: 'Model.findByPk(id, null);',
      errors: [{ messageId: 'requireFindByPkAttributes' }],
    },
    {
      code: 'Model.findByPk(id, undefined);',
      errors: [{ messageId: 'requireFindByPkAttributes' }],
    },
    {
      code: 'Model.findByPk(id, options);',
      errors: [{ messageId: 'requireFindByPkAttributes' }],
    },
    {
      code: 'Model.findByPk(id, { where: { id } });',
      errors: [{ messageId: 'requireFindByPkAttributes' }],
    },
    {
      code: 'Model.findByPk(id, { include: [User] });',
      errors: [{ messageId: 'requireFindByPkAttributes' }],
    },
    {
      code: 'Model.findByPk(id, { include: [User], ...options });',
      errors: [{ messageId: 'requireFindByPkAttributes' }],
    },
    {
      code: 'Model.findOne({ where: { id } });',
      errors: [{ messageId: 'requireFindByPkAttributes' }],
    },
    {
      code: 'Model.findAll({ where: { id } });',
      errors: [{ messageId: 'requireFindByPkAttributes' }],
    },
    {
      code: 'Model.findOne();',
      errors: [{ messageId: 'requireFindByPkAttributes' }],
    },
  ],
});
