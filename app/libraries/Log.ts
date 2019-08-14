import * as winston from 'winston';
import * as SegfaultHandler from 'segfault-handler';
import * as fs from 'fs';
import * as path from 'path';
import { config } from './../config/config';
import { isUndefined } from 'util';

const prettyJson = winston.format.printf(info => {
  if(info.parent && info.name) {
    return `${info.timestamp} ${info.level}: ${info.name} - ${info.parent}`;
  }
  if ((typeof info.message) === 'object') {
    return `${info.timestamp} ${info.level}: ${JSON.stringify(info.message) }`;
  }

  if(isUndefined(info.message)) {
    // console.log(info); // helps you debug if winston fails to get the error
  }
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

export const log = winston.createLogger();
export const requestLog = winston.createLogger();

// Setting up logger
const logDir = path.join(process.env.HOME, '.orve-clients-core-logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

SegfaultHandler.registerHandler(
  path.join(logDir, 'orve-clients-core-segfault.log'),
);

// A console transport logging debug and above.
log.add(
  new winston.transports.Console({
    level: config.log.level,
    format: winston.format.combine(
      winston.format.json(),
      winston.format.colorize(),
      winston.format.timestamp(),
      prettyJson,
    ),
  }),
);

// A file based transport logging only errors formatted as json.
log.add(
  new winston.transports.File({
    level: 'error',
    filename: path.join(logDir, 'orve-clients-core-error.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  }),
);

log.add(
  new winston.transports.File({
    level: 'warn',
    filename: path.join(logDir, 'orve-clients-core-warn.log'),
    format: winston.format.combine(winston.format.json()),
  }),
);

log.add(
  new winston.transports.File({
    level: 'debug',
    filename: path.join(logDir, 'orve-clients-core-debug.log'),
    format: winston.format.combine(winston.format.json()),
  }),
);

requestLog.add(
  new winston.transports.Console({
    level: config.log.level,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`,
      ),
    ),
  }),
);

requestLog.add(
  new winston.transports.File({
    level: 'info',
    filename: path.join(logDir, 'orve-clients-core-requests.log'),
    format: winston.format.combine(winston.format.json()),
  }),
);

export const requestLogStream: any = {
  write: function(message, encoding) {
    requestLog.info(message.trim());
  },
};
