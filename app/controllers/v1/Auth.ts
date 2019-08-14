import { Controller } from '../../libraries/Controller';
import { User } from './../../models/User';
import { Profile } from './../../models/Profile';
import { JWTBlacklist } from './../../models/JWTBlacklist';
import { Request, Response, Router, NextFunction } from 'express';
import { log } from './../../libraries/Log';
import { config } from './../../config/config';
import { validateJWT } from './../../policies/General';
import mailer from './../../services/EmailService';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as jwt from 'jsonwebtoken';
import * as uuid from 'uuid';
import { isNullOrUndefined } from 'util';

interface Token {
  token: string;
  expires: number;
  expires_in: number;
}

interface Credentials {
  token: Token;
  refresh_token: Token;
  user: User;
  profile: Profile;
}

export class AuthController extends Controller {
  constructor() {
    super();
    this.name = 'auth';
  }

  routes(): Router {
    this.router.post('/login', 
      (req: Request, res: Response, next: NextFunction) => this.login(req, res, next)
    );
    this.router.post('/logout',
      validateJWT('access'),
      (req: Request, res: Response, next: NextFunction) => this.logout(req, res, next),
    );
    this.router.get('/reset',
      (req: Request, res: Response, next: NextFunction) => this.resetGet(req, res, next)
    );
    this.router.post('/reset',
      (req: Request, res: Response, next: NextFunction) => this.resetPost(req, res, next)
    );
    this.router.post('/change',
      validateJWT('access'),
      (req: Request, res: Response, next: NextFunction) => this.changePassword(req, res, next),
    );
    this.router.post('/refresh',
      validateJWT('refresh'),
      (req: Request, res: Response, next: NextFunction) => this.refreshToken(req, res, next),
    );

    return this.router;
  }

  public createToken(user: any, type: string): Token {
    let expiryUnit: any = config.jwt[type].expiry.unit;
    let expiryLength = config.jwt[type].expiry.length;
    let expires = moment()
      .add(expiryLength, expiryUnit)
      .valueOf();
    let issued = Date.now();
    let expires_in = (expires - issued) / 1000; // seconds

    let token = jwt.sign(
      {
        id: user.id,
        sub: config.jwt[type].subject,
        aud: config.jwt[type].audience,
        exp: expires,
        iat: issued,
        jti: uuid.v4(),
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      config.jwt.secret,
    );

    return {
      token: token,
      expires: expires,
      expires_in: expires_in,
    };
  }

  protected getCredentials(user: User): Credentials {
    // Prepare response object
    const token = this.createToken(user, 'access');
    const refreshToken = this.createToken(user, 'refresh');
    return {
      token: token,
      refresh_token: refreshToken,
      user: user,
      profile: user.profile,
    };
  }

  private async sendEmailNewPassword(
    user: User,
    token: string,
    name: string = user.email,
  ): Promise<any> {
    const subject = 'Instructions for restoring your password';

    const info = await mailer.sendEmail({
      email: user.email,
      page: 'password_recovery',
      context: {
        url: `${config.urls.baseApi}/auth/reset?token=${token}`,
        name,
      },
      subject,
    });

    log.debug('Sending password recovery email to:', user.email, info);

    return info;
  }

  private async sendEmailPasswordChanged(
    user: User,
    name: string = user.email,
  ): Promise<any> {
    const subject = 'Password restored';

    const info = await mailer.sendEmail({
      email: user.email,
      page: 'password_changed',
      context: { name },
      subject,
    });

    log.debug('Sending password changed email to:', user.email, info);
    return info;
  }

  private async handleResetEmail(email: string): Promise<any> {
    const user = await User.findOne({
      where: { email: email },
      include: [{ model: Profile }],
    });
    if (!user) {
      throw { error: 'notFound', msg: 'Email not found' };
    }

    // Create reset token
    let token = this.createToken(user, 'reset');
    return this.sendEmailNewPassword(user, token.token, user.name);
  }

  private async handleResetChPass(
    token: string,
    password: string,
  ): Promise<Credentials> {
    const decodedjwt = await this.validateJWT(token, 'reset');

    if (!decodedjwt) {
      throw { error: 'unauthorized', msg: 'Invalid Token' };
    }

    let user = await User.findOne({ where: { id: decodedjwt.id } });

    if (!user) {
      throw { error: 'unauthorized' };
    }

    user.password = password;

    try {
      user = await user.save();
      if (!user) { throw { error: 'serverError', msg: null }; }
    } catch (err) {
      log.error(err);
      throw err;
    }

    try {
      await JWTBlacklist.create({
        token: token,
        expires: decodedjwt.exp,
      });
    } catch (err) {
      log.error(err);
    }

    try {
      await this.sendEmailPasswordChanged(user);
    } catch (err) {
      log.error(err);
    }

    return this.getCredentials(user);
  }

  public async validateJWT(token: string, type: string): Promise<any> {
    // Decode token
    const decodedjwt: any = jwt.verify(token, config.jwt.secret);
    const reqTime = Date.now();

    // Check if token expired
    if (decodedjwt.exp <= reqTime) {
      throw new Error('Token expired');
    }
    // Check if token is early
    if (!_.isUndefined(decodedjwt.nbf) && reqTime <= decodedjwt.nbf) {
      throw new Error('This token is early.');
    }

    // If audience doesn't match
    if (config.jwt[type].audience !== decodedjwt.aud) {
      throw new Error('This token cannot be accepted for this domain.');
    }

    // If the subject doesn't match
    if (config.jwt[type].subject !== decodedjwt.sub) {
      throw new Error('This token cannot be used for this request.');
    }

    const jwtblacklist = await JWTBlacklist.findOne({
      where: { token: token },
    });

    if (jwtblacklist != null) {
      throw new Error('This Token is blacklisted.');
    }

    return decodedjwt;
  }

  async login(req: Request, res: Response, next: NextFunction) {

    try {
      const email = req.body.email;
      const password = req.body.password;
      // Validate
      if (email == null || password == null) {
        return Controller.badRequest(res);
      }

      const user = await User.findOne({
        where: { email: email },
        include: [{ model: Profile }],
      });

      let authenticated = false;
      if (user) {
        authenticated = await user.authenticate(password);
      }

      if (authenticated) {
        const credentials = this.getCredentials(user);
        return Controller.ok(res, null, credentials);
      } else {
        return Controller.unauthorized(res);
      }
    } catch (err) {
      return next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      let token: string = req.session.jwtstring;
      let decodedjwt: any = req.session.jwt;

      if (isNullOrUndefined(token) || isNullOrUndefined(decodedjwt)) {
        return Controller.unauthorized(res);
      }

      // Put token in blacklist
      const jwt = await JWTBlacklist.create({
        token: token,
        expires: decodedjwt.exp,
      });

      return Controller.ok(res);
    } catch (err) {
      return next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Refresh token has been previously authenticated in validateJwt as refresh token
      let refreshToken: string = req.session.jwtstring;
      let decodedjwt: any = req.session.jwt;
      let reqUser: User = req.session.user;

      // Put refresh token in blacklist
      await JWTBlacklist.create({
        token: refreshToken,
        expires: decodedjwt.exp,
      });

      const user = await User.findOne({ where: { id: reqUser.id } });

      if (!user) { return Controller.unauthorized(res); }

      // Create new token and refresh token and send
      const credentials: Credentials = this.getCredentials(user);
      return Controller.ok(res, null, credentials);
    } catch (err) {
      return next(err);
    }
  }

  /*
    This can serve two different use cases:
      1. Request sending of recovery token via email (body: { email: '...' })
      2. Set new password (body: { token: 'mytoken', password: 'newpassword' })
  */
  async resetPost(req: Request, res: Response, next: NextFunction) {
    try {
      const token: string = req.body.token,
        password: string = req.body.password,
        email: string = req.body.email;

      // Validate if case 2
      if (!isNullOrUndefined(token) && !isNullOrUndefined(password)) {
        const credentials = await this.handleResetChPass(token, password);
        return Controller.ok(res, null, credentials);
      }

      // Validate case 1
      if (!isNullOrUndefined(email)) {
        const info = this.handleResetEmail(email);
        log.info(info);
        return Controller.ok(res);
      }

      return Controller.badRequest(res);
    } catch (err) {
      return next(err);
    }
  }

  async resetGet(req: Request, res: Response, next: NextFunction) {
    try {
      let token: any = req.query.token;
      if (isNullOrUndefined(token)) {
        return Controller.unauthorized(res);
      }
      // Decode token
      const decodedjwt = await this.validateJWT(token, 'reset');
      if (decodedjwt) {
        return Controller.redirect(
          res,
          `${config.urls.base}/recovery/#/reset?token=${token}`,
        );
      } else {
        return Controller.unauthorized(res);
      }
    } catch (error) {
      return next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      let oldPass = req.body.oldPass;
      let newPass = req.body.newPass;
      // Validate
      if (isNullOrUndefined(oldPass) || isNullOrUndefined(newPass) ) {
        return Controller.badRequest(res);
      }

      let user = req.session.user as User; 

      let authenticated = false;

      if (user) {
        authenticated = await user.authenticate(oldPass);
      }

      if (!authenticated) {
        return Controller.unauthorized(res);
      }

      user.password = newPass;
      user = await user.save();
      const credentials = this.getCredentials(user);
      return Controller.ok(res, null, credentials);

    } catch (error) {
      return next(error);
    }
  }
}

const controller = new AuthController();
export default controller;
