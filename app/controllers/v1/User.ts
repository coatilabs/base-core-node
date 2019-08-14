import { Controller } from '../../libraries/Controller';
import { User } from './../../models/User';
import { Request, Response, Router, NextFunction } from 'express';
import { validateJWT, filterRoles, onlyLogged } from './../../policies/General';
import { Profile } from '../../models/Profile';
import { Op } from 'sequelize';
import * as moment from 'moment';
import * as yup from 'yup';
import { validateYup } from '../../libraries/util';

export class UserController extends Controller {
  constructor() {
    super();
    this.name = 'user';
  }

  routes(): Router {
    this.router.get('/me', 
      validateJWT('access'),
      onlyLogged(), 
      (req: Request, res: Response, next: NextFunction) => this.findMe(req, res, next),
    );

    this.router.post('/me',
      validateJWT('access'),
      onlyLogged(),
      (req: Request, res: Response, next: NextFunction) => this.updateMe(req, res, next),
    );

    return this.router;
  }

  async findMe(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const user: User = req.session.user;
      const profile: Profile = await user.$get('profile') as Profile;

      return Controller.ok(res, null, {
        user, profile
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {

      let user: User = req.session.user;
      let profile: Profile = await user.$get('profile') as Profile;

      //based on: https://www.sitepoint.com/community/t/phone-number-regular-expression-validation/2204
      const phoneRegExp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

      const schema = yup.object().shape({
        user: yup.object().shape({
          name: yup.string(),
          email: yup.string().email()
        }),
        profile: yup.object().shape({
          time_zone: yup.string(),
          phone: yup.string().matches(phoneRegExp),
          locale: yup.mixed().oneOf(Profile.LOCALES)
        })
      });

      try {
        await validateYup(req.body, schema);
      } catch (err) {
        return Controller.badRequest(res, err.name, err.errors);
      }

      if (req.body.user) {
        if (req.body.user.name) { user.name = req.body.user.name; }
        if (req.body.user.email) { user.email = req.body.user.email; }
        user = await user.save();
      } 

      if (req.body.profile) {
        if (req.body.profile.time_zone) { profile.time_zone = req.body.profile.time_zone; }
        if (req.body.profile.locale) { profile.locale = req.body.profile.locale;}
        if (req.body.profile.phone) { profile.phone = req.body.profile.phone; }

        profile = await profile.save();
      } 

      return Controller.ok(res, null, { user, profile });
    } catch (error) {
      return next(error);
    } 
  }
}

const controller = new UserController();
export default controller;
