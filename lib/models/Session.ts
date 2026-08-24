import { DataTypes, Model } from 'sequelize';
import type { AdapterSession } from '@auth/core/adapters';
import db from '../db';
import { WithOptionalId } from '../db/types';

/**
 * A single logged-in session (tying a session ID on a device to a logged-in
 * user based on
 * https://authjs.dev/concepts/database-models
 */
export interface SessionAttributes extends AdapterSession {
  id: number;
}

export interface SessionCreationAttributes extends WithOptionalId<SessionAttributes> {}

export interface SessionInstance
  extends
    Model<SessionAttributes, SessionCreationAttributes>,
    SessionAttributes {}

/**
 * A single logged-in session (tying a session ID on a device to a logged-in
 * user based on
 * https://authjs.dev/concepts/database-models
 */
const Session = db.define<SessionInstance>('Session', {
  // The below lines are copied from
  // node_modules/@auth/sequelize-adapter/models.js
  // as our scripts use `babel-node`, which doesn't currently support
  // ES Modules (which is what next-auth's sequelize adapter uses)
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  expires: { type: DataTypes.DATE, allowNull: false },
  sessionToken: {
    type: DataTypes.STRING,
    unique: 'sessionToken',
    allowNull: false,
  },
  userId: { type: DataTypes.INTEGER.UNSIGNED },
});

export default Session;
