/*
  JanitorService
    Manages periodical cleanup of DB according to business rules

  Business logic:
    Cleanup expired blacklisted tokens each 24h
*/

import * as cron from 'node-cron';
import { log } from './../libraries/Log';
import { JWTBlacklist } from './../models/JWTBlacklist';
import { Op } from 'sequelize';

class JanitorService {
  init() {
    // Every day at 0:00
    cron.schedule('0 0 * * *', async () => {
      let today = new Date();
      // Example: let hour = 60 * 60 * 1000;
      // Example: let day = 24 * hour;
      // Example: let days30ago = new Date(today.getTime() - 30 * day);
      // Example: let hours1ago = new Date(today.getTime() - 1 * hour);
      // Cleanup expired blacklisted tokens each 24h
      try {
        await JWTBlacklist.destroy({ where: { expires: { [Op.lt]: today } } });
      } catch (err) {
        log.error('Jaintor error:', err);
      }
    });
  }
}

const janitorService = new JanitorService();
export default janitorService;
