import { config } from './config/config';

import bugsnag from '@bugsnag/js';
import bugsnagExpress from '@bugsnag/plugin-express';
import { RequestHandlerParams } from 'express-serve-static-core';
export const bugsnagClient = bugsnag({
  apiKey: config.bugsnag_key,
  filters: ['password', 'token_id', 'token_id'],
  releaseStage: config.env,
  notifyReleaseStages: [ 'production', 'staging' ] ,
});
bugsnagClient.use(bugsnagExpress);

export const middleware: {requestHandler: RequestHandlerParams, errorHandler: RequestHandlerParams} = bugsnagClient.getPlugin('express');

