import { Request } from 'express';
import * as core from 'express-serve-static-core';

declare module 'express' {
  export interface Request extends core.Request {
    session?: any;
  }
}