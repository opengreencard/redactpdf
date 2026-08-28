"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const require_find_by_pk_attributes_1 = __importDefault(require("./require-find-by-pk-attributes"));
const ruleTester_1 = __importDefault(require("./ruleTester"));
ruleTester_1.default.run('require-find-by-pk-attributes', require_find_by_pk_attributes_1.default, {
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
