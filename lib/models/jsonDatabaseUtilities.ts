import { Model } from 'sequelize';

/**
 * Makes a Sequelize getter for a property stored as a JSON string.
 *
 * A missing value is returned as null so the getter mirrors a nullable
 * database column instead of attempting to parse an empty string.
 */
export function makeJSONGetter(property: string) {
  return function getJSON(this: Model<any>) {
    const value = this.getDataValue(property);
    if (!value) return null;
    return JSON.parse(value);
  };
}

/**
 * Makes a Sequelize setter for a property stored as a JSON string.
 */
export function makeJSONSetter(property: string) {
  return function setJSON(this: Model<any>, value: unknown | null) {
    if (value == null) {
      this.setDataValue(property, null);
    } else {
      this.setDataValue(property, JSON.stringify(value));
    }
  };
}
