import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as methodOverride from 'method-override';
import * as favicon from 'serve-favicon';
import * as path from 'path';
import * as compression from 'compression';
import { __express as handleBars } from 'hbs';
import { routes } from './routes';
import { log, requestLogStream } from './libraries/Log';
import { config } from './config/config';
import { createServer } from 'http';
import { middleware } from './bugsnag';
import chalk from 'chalk';

declare global {
  namespace Express {
    interface Request {
      session?: any;
    }
  }
}

export const app = express();
export const server = createServer(app);

// It can only capture errors in downstream middleware
app.use(middleware.requestHandler);

// Security middleware
app.use(helmet());

// Util middleware
app.use(methodOverride());

app.use(favicon(path.join(__dirname, '../public/favicon.ico')));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Response compression
app.use(compression());

// use morgan to log requests to the console
app.use(morgan('short', { stream: requestLogStream }));

app.set('views', `${config.root}/views`);
app.set('view engine', 'html');
app.engine('html', handleBars);

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.header('Access-Control-Expose-Headers', 'Content-Count');
  next();
});

routes(app);

app.use(middleware.errorHandler)

export async function setupServer(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      server.listen(config.server.port, () => {
        log.info(`application started at port ${chalk.green(config.server.port.toString())}`);
        resolve(true);
      });
    } catch (err) {
      reject(err);
    }
  });
}
