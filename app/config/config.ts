import * as ip from 'ip';
import * as path from 'path';
import { Dialect } from 'sequelize/types/lib/sequelize';

export const config = {
  root: path.normalize(`${__dirname}/..`),

  env: process.env.NODE_ENV || 'development',

  jwt: {
    secret:
      process.env.JWT_SECRET || 'a secret token',
    access: {
      expiry: {
        unit: 'months',
        length: 2,
      },
      subject: 'access',
      audience: 'user',
    },
    refresh: {
      expiry: {
        unit: 'months',
        length: 12,
      },
      subject: 'refresh',
      audience: 'user',
    },
    reset: {
      expiry: {
        unit: 'hours',
        length: 12,
      },
      subject: 'reset',
      audience: 'user',
    },
  },

  email: {
    fromAddress:
      process.env.EMAIL_FROM_ADDRESS || 'MyApp <no-reply@example.com>',
    auth: {
      api_key: process.env.EMAIL_API_KEY || '(your mailgun api key)',
      domain: process.env.EMAIL_DOMAIN || '(your mailgun domain)',
    },
  },

  bugsnag_key: process.env.BUGSNAG_KEY,

  server: {
    port: process.env.PORT || 8888,
  },

  log: {
    // Console Log levels: error, warn, info, verbose, debug, silly
    level: process.env.LOG_LEVEL || 'debug',
  },

  urls: {
    // Url config as seen from the user NOT NECESSARILY THE SAME AS SERVER
    // http or https
    protocol: process.env.URLS_PROTOCOL || 'http',
    url: process.env.URLS_URL || ip.address(),
    port: process.env.URLS_PORT ? String(process.env.URLS_PORT) : '',
    apiRoot: process.env.URLS_API_ROOT || '/api/v1',
    base: null,
    baseApi: null,
  },
};

let portString = '';
if (Number.isInteger(parseInt(config.urls.port))) {
  portString = `:${config.urls.port}`;
}

config.urls.base = `${config.urls.protocol}://${config.urls.url}${portString}`;
config.urls.baseApi = `${config.urls.base}${config.urls.apiRoot}`;
