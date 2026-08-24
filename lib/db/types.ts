import { Model, Optional } from 'sequelize';

/**
 * Get an instance type that only has certain attributes:
 * a common result of SomeModel.findAll({ attributes: ['a', 'b', 'c'] });
 *
 * Example usage:
 *
 * ```ts
 * const results = await SomeModel.findAll({
 *   attributes: ['a', 'b', 'c'],
 * }) as PartialInstance<SomeModelAttributes, 'a' | 'b' | 'c'>[];
 * ```
 */
export type PartialInstance<
  AttributesT extends { id: number; updatedAt?: Date; createdAt?: Date },
  PickKeys extends keyof AttributesT,
  CreationAttributesT extends {} = Optional<
    AttributesT,
    'id' | 'updatedAt' | 'createdAt'
  >,
> = Model<AttributesT, CreationAttributesT> & Pick<AttributesT, PickKeys>;

/**
 * Helper type that's useful for making the ID field optional, for Sequelize
 * creation attributes
 */
export type WithOptionalId<AttributesT extends { id: number }> = Optional<
  AttributesT,
  'id'
>;
