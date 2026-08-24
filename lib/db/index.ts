import { Sequelize } from 'sequelize';
import mariadb from 'mariadb';
import config from '../config';

const db = new Sequelize({
  // Note: these will be changed down the line:
  // https://www.notion.so/wanderlog/Change-database-to-use-credentials-in-environment-variables-b3780a5967b04a89a9a51c56c6875e59?pvs=4
  host: config.db.host,
  dialect: 'mariadb',
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  // We seem to need to specify the dialectModules explicitly to avoid
  // > Please install mariadb package manually
  // errors when running `yarn build` or `yarn d
  // https://github.com/orgs/vercel/discussions/234#discussioncomment-5980199
  dialectModule: mariadb,
  logging: false,
  dialectOptions: {
    connectTimeout: 5000,
  },
});

export default db;
