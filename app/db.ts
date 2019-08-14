import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { Op, Dialect } from 'sequelize';
import { log } from './libraries/Log';
import { config } from './config/config';
import * as path from 'path';
import chalk from 'chalk';


const dbOptions: SequelizeOptions = {
  database: process.env.DB_NAME || 'database',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  logging: (sql, timing) => {
    log.debug(chalk.yellow('MySQL') + `: ${sql} Elapsed time: ${timing}ms`);
  },
  benchmark: true,
  define: {
    freezeTableName: true,
    timestamps: true,
    underscored: true,
  }
};

export const db = new Sequelize(dbOptions);

// Should be called in server
export async function setup(): Promise<any> {
  return await db.authenticate();
}
