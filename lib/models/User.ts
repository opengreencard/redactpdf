import { DataTypes, Model } from 'sequelize';
import type { AdapterUser } from '@auth/core/adapters';
import db from '../db';
import { WithOptionalId } from '../db/types';

export enum UserRole {
  administrator = 'Administrator',
  normal = 'Normal',
}

/**
 * A user, as created by Next-Auth: based on
 * https://authjs.dev/concepts/database-models
 */
export interface UserAttributes extends Omit<AdapterUser, 'id' | 'email'> {
  /** We patch next-auth so that we instead use numeric IDs */
  id: number;
  /**
   * Unlike AdapterUser, email is nullable (certain OAuth providers don't
   * provide it)
   */
  email: string | null;
  /** Hashed bcrypt password */
  password: string | null;
  role: UserRole;
}

export interface UserCreationAttributes extends WithOptionalId<UserAttributes> {}

export interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {}

/**
 * A user, as created by Next-Auth: based on
 * https://authjs.dev/concepts/database-models
 */
const User = db.define<UserInstance>('User', {
  // The below lines are copied from
  // node_modules/@auth/sequelize-adapter/models.js, except with
  // id changed to an INTEGER.UNSIGNED from an UUID
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: 'email' },
  emailVerified: { type: DataTypes.DATE },
  image: { type: DataTypes.STRING },

  // Lines below these are NOT from sequelize-adapter/models.js, and are
  // added for our own application
  password: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.normal,
  },
});

export default User;
