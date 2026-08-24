import { sync as globSync } from 'glob';
import { ModelStatic } from 'sequelize';

//
// This file can be required anywhere we want to require all
// the models present in server/models
//

/**
 * Used to filter out tests when requiring model files. Otherwise, the tests
 * will be required in this file, before jest globals like `describe` and `it`
 * are set up.
 */
function isNotTest(path: string) {
  return !/\.test\./.test(path);
}

const files = [
  ...globSync(`${__dirname}/models/**/*.ts`),
  ...globSync(`${__dirname}/models/**/*.js`),
];
const allDatabaseModels: ModelStatic<any>[] = [];

for (const file of files) {
  if (isNotTest(file)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const required = require(file);

    if (required.default && required.default.getTableName) {
      allDatabaseModels.push(required.default);
    }
  }
}

export default allDatabaseModels;
