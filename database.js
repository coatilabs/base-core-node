var path = process.env.NODE_ENV === 'test' ? './.env.test' : './.env';
require('dotenv').config({ path: path });

var env = process.env.NODE_ENV || 'development';

var db = {
  database: process.env.DB_NAME || 'database',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  dialect: process.env.DB_DIALECT || 'mysql',
  storage: process.env.DB_DIALECT === 'sqlite' ? './db.sqlite' : null,
};

module.exports = {
  [env]: db,
};
