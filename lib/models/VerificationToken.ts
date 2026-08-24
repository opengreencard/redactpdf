import { DataTypes, Model } from 'sequelize';
import type { VerificationToken as VerificationTokenType } from '@auth/core/adapters';
import db from '../db';

/**
 * A token used to verify a user for email-based authentication if we choose to
 * enable that particular authentication method
 * https://authjs.dev/concepts/database-models
 */
export interface VerificationTokenAttributes extends VerificationTokenType {}

export interface VerificationTokenCreationAttributes extends VerificationTokenAttributes {}

export interface VerificationTokenInstance
  extends
    Model<VerificationTokenAttributes, VerificationTokenCreationAttributes>,
    VerificationTokenAttributes {}

/**
 * A token used to verify a user for email-based authentication if we choose to
 * enable that particular authentication method
 * https://authjs.dev/concepts/database-models
 */
const VerificationToken = db.define<VerificationTokenInstance>(
  'VerificationToken',
  {
    // The below lines are copied from
    // node_modules/@auth/sequelize-adapter/models.js
    // as our scripts use `babel-node`, which doesn't currently support
    // ES Modules (which is what next-auth's sequelize adapter uses)
    token: { type: DataTypes.STRING, primaryKey: true },
    identifier: { type: DataTypes.STRING, allowNull: false },
    expires: { type: DataTypes.DATE, allowNull: false },
  }
);

export default VerificationToken;
