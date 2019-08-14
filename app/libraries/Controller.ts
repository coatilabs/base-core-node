import { Request, Response, Router, NextFunction } from 'express';
import { log } from './Log';
import * as _ from 'lodash';
import { isNull } from 'lodash';

export class Controller {
  public name: string; // Name used for the route, all lowercase
  protected router: Router;

  constructor() {
    this.router = Router();
    // Initialize req.session
    this.router.use((req: Request, res: Response, next: NextFunction) => {
      if (req.session == null) req.session = {};
      return next();
    });
  }

  routes(): Router {
    // Example routes
    // WARNING: Routes without policies
    // You should add policies before your method
    log.warn('You should add policies before your method');
    return this.router;
  }

  public static ok(res: Response,  message: string = null , data: any = {}, count?: number ) {
    if(isNull(message)) message = 'ok';
    if (count) {
      return res
        .set('Content-Count', String(count))
        .status(200)
        .json({
          status: 200,
          message,
          data
        });
    }
    return res.status(200).json({
      status: 200,
      message,
      data
    });
  }

  public static created(res: Response, message: string = null, data: any = {} ) {
    if(isNull(message)) message = 'created';
    return res.status(201).json({
      status: 201,
      message,
      data
    });
  }

  public static noContent(res: Response) {
    return res.status(204).end();
  }

  public static redirect(res: Response, url: string) {
    return res.redirect(url);
  }

  public static badRequest(res: Response, message: string = null, data: any = {}) {
    if(isNull(message)) message = 'bad_request';
    return res.status(400).json({
      status: 400,
      message,
      data
    });
  }

  public static unauthorized(res: Response, message: string = null, data: any = {}) {
    if(isNull(message)) message = 'unauthorized';
    return res.status(401).json({
      status: 401,
      message,
      data
    });
  }

  public static forbidden(res: Response, message: string = null, data: any = {}) {
    if(isNull(message)) message = 'forbidden';
    return res.status(403).json({
      status: 403,
      message,
      data
    });
  }

  public static notFound(res: Response, message: string = null, data: any = {}) {
    if(isNull(message)) message = 'not_found';
    return res.status(404).json({
      status: 404,
      message,
      data
    });
  }

  public static serverError(res: Response, message: string = null, data?: any ) {
    // TODO: consideer option for sending err on debug mode
    log.error(data);
    if(isNull(message)) message = 'server_error';
    return res.status(500).send({
      status: 500,
      message
    });
  }

  public static timeout(res: Response, message: string = null) {
    if(isNull(message)) message = 'timeout';
    return res.status(504).json({
      status: 504,
      message
    });
  }
}
