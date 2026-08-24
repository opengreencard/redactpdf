import randomstring from 'randomstring';
import { DataTypes, Model } from 'sequelize';
import db from '../db';
import { WithOptionalId } from '../db/types';
import { makeJSONGetter, makeJSONSetter } from './jsonDatabaseUtilities';
import { RedactionBoundingBox, RedactionStatus } from './redactionTypes';

/** The fixed length used for unguessable redaction lookup keys. */
export const redactionKeyLength = 32;

/** Generate a random key used to look up one redaction document. */
export function generateRedactionKey(): string {
  return randomstring.generate(redactionKeyLength);
}

/** Database attributes for one uploaded redaction document. */
export interface RedactionAttributes {
  id: number;
  key: string;
  pageCount: number;
  redactionBoundingBoxes: RedactionBoundingBox[];
  status: RedactionStatus;
  createdAt: Date;
}

/** Attributes accepted when creating a redaction row. */
export interface RedactionCreationAttributes extends WithOptionalId<
  Omit<RedactionAttributes, 'createdAt'>
> {}

/** Sequelize instance type for a redaction row. */
export interface RedactionInstance
  extends
    Model<RedactionAttributes, RedactionCreationAttributes>,
    RedactionAttributes {}

/** Persist the uploaded document and its current redaction suggestions. */
const Redaction = db.define<
  RedactionInstance,
  Omit<RedactionAttributes, 'createdAt'>
>(
  'Redaction',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING(redactionKeyLength),
      allowNull: false,
      unique: true,
    },
    pageCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    redactionBoundingBoxes: {
      type: DataTypes.TEXT('medium'),
      allowNull: false,
      get: makeJSONGetter('redactionBoundingBoxes'),
      set: makeJSONSetter('redactionBoundingBoxes'),
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RedactionStatus)),
      allowNull: false,
    },
  },
  {
    indexes: [
      { name: 'key', unique: true, fields: ['key'] },
      { name: 'createdAt_id', fields: ['createdAt', 'id'] },
    ],
  }
);

export default Redaction;
