import { Application, static as Static, Request, Response, Router } from 'express';
import * as path from 'path';
import { log } from './libraries/Log';
import AuthController from './controllers/v1/Auth';
import UserController from './controllers/v1/User';


const apiV1 = (): Router => {

  const router = Router();

  router.use(`/${AuthController.name}`, AuthController.routes());
  router.use(`/${UserController.name}`, UserController.routes());

  return router;

}

export function routes(app: Application) {

  app.use('/api/v1/', apiV1());

  app.use(Static(path.join(__dirname, '../public')));

  app.get('/*', (req: Request, res: Response) => {
    return res.status(405).send({
      message: 'Method not allowed'
    });
  });

  app.post('/*', (req: Request, res: Response) => {
    return res.status(405).send({
      message: 'Method not allowed'
    });
  });


  app.use((err, req, res, next) => {
    log.error(err);
    return res.status(500).send({
      message: 'Internal Server Error'
    });
  });
}
