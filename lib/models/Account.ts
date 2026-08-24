import { DataTypes, Model } from 'sequelize';
import type { AdapterAccount } from '@auth/core/adapters';
import db from '../db';
import { WithOptionalId } from '../db/types';

/**
 * An account that was used to log in for a given user, as created by Next-Auth:
 * based on
 * https://authjs.dev/concepts/database-models
 */
export interface AccountAttributes extends Pick<
  AdapterAccount,
  // Note: we must manually pick these fields or else we'll extend
  // Partial<OpenIDTokenEndpointResponse>
  // which includes the fallback parameter:
  // `readonly [parameter: string]: JsonValue | undefined;`
  | 'id'
  | 'userId'
  | 'type'
  | 'provider'
  | 'providerAccountId'
  | 'expires_at'
  | 'access_token'
  | 'expires_in'
  | 'id_token'
  | 'refresh_token'
  | 'scope'
  | 'session_state'
  | 'authorization_details'
  | 'token_type'
> {
  id: number;
}

export interface AccountCreationAttributes extends WithOptionalId<AccountAttributes> {}

export interface AccountInstance
  extends
    Model<AccountAttributes, AccountCreationAttributes>,
    AccountAttributes {}

/**
 * An account that was used to log in for a given user, as created by Next-Auth:
 * based on
 * https://authjs.dev/concepts/database-models
 */
const Account = db.define<AccountInstance>('Account', {
  // The below lines are copied from
  // node_modules/@auth/sequelize-adapter/models.js, except with
  // id/userId changed to an INTEGER.UNSIGNED from an UUID
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  // Use ASCII charset + ascii_bin collation for all string fields: OAuth
  // tokens, provider IDs, and scopes are ASCII-only and should be compared
  // byte-for-byte (case-sensitive, no Unicode normalization).
  type: {
    type: `${DataTypes.STRING()} CHARSET ascii COLLATE ascii_bin`,
    allowNull: false,
  },
  provider: {
    type: `${DataTypes.STRING()} CHARSET ascii COLLATE ascii_bin`,
    allowNull: false,
  },
  providerAccountId: {
    type: `${DataTypes.STRING()} CHARSET ascii COLLATE ascii_bin`,
    allowNull: false,
  },
  // Access tokens are often up to 4096 characters long
  // https://authjs.dev/concepts/database-models#access_token
  refresh_token: {
    type: `${DataTypes.STRING(4096)} CHARSET ascii COLLATE ascii_bin`,
  },
  access_token: {
    type: `${DataTypes.STRING(4096)} CHARSET ascii COLLATE ascii_bin`,
  },
  expires_at: { type: DataTypes.INTEGER },
  token_type: {
    type: `${DataTypes.STRING()} CHARSET ascii COLLATE ascii_bin`,
  },
  scope: {
    type: `${DataTypes.STRING()} CHARSET ascii COLLATE ascii_bin`,
  },
  id_token: {
    type: `${DataTypes.TEXT()} CHARSET ascii COLLATE ascii_bin`,
  },
  session_state: {
    type: `${DataTypes.STRING()} CHARSET ascii COLLATE ascii_bin`,
  },
  userId: { type: DataTypes.INTEGER.UNSIGNED },
});

export default Account;
