require('dotenv').config();

import { log } from './libraries/Log';
import * as db from './db';
import * as erp from './erp';
import { setupServer } from './server';
import JanitorService from './services/JanitorService';

process.env.TZ = 'UTC'; // IMPORTANT For correct timezone management with DB, Tasks etc.

(async () => {
  try {
    // Wait for the two database connections
    await Promise.all([ db.setup(), erp.setup() ]);

    JanitorService.init();
    await setupServer();
  } catch (error) {
    log.error(error);
  }
})();
