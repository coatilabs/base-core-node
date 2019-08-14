import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import * as path from 'path';
import { log } from './libraries/Log';
import chalk from 'chalk';

const dbOptions: SequelizeOptions = {
  database: process.env.DB_ERP_NAME || 'GORVE',
  username: process.env.DB_ERP_USER || 'root',
  password: process.env.DB_ERP_PASSWORD || '',
  host: process.env.DB_ERP_HOST || 'localhost',
  dialect: 'mssql',
  modelPaths: [path.join(__dirname, '/models/**/*.erp.js')],
  benchmark: true,
  logging: (sql, timing) => {
    log.debug(chalk.yellow('MSSQL') + `: ${sql} Elapsed time: ${timing}ms`);
  },
  modelMatch: (filename, member) => {
    return filename.replace('.erp', '') === member;
  },
  dialectOptions: {
    requestTimeout: 30000 // timeout = 30 seconds
  }, 
  define: {
    freezeTableName: true,
    timestamps: false,
    underscored: true,
  },
  hooks: {
    beforeSave: (instance, options) => { throw new Error('You cannot modify this database.'); }
  }
};

export const db = new Sequelize(dbOptions);

// Should be called in server
export async function setup(): Promise<any> {
  return await db.authenticate();
}
