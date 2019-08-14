import { Request, Response } from 'express';
import { default as auth } from './../controllers/v1/Auth';
import * as _ from 'lodash';
import { Controller } from '../libraries/Controller';
import { RequestHandlerParams, NextFunction } from 'express-serve-static-core';
import { User } from '../models/User';

/*
  Validates a JWT
  puts decoded jwt in req.session.jwt
  puts user object with id, email and role in req.session.user
*/
export function validateJWT(type: string): RequestHandlerParams {
  return async (req: Request, res: Response, next: NextFunction) => {
    let token: string = null;
    let authorization: string = req.get('Authorization');
    if (req.session == null) {
      req.session = {};
    }

    if (authorization == null) {
      return next();
    }

    let parts: string[] = authorization.split(' ');
    if (parts.length === 2) {
      let scheme: string = parts[0];
      let credentials: string = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }
    }

    try {
      const decoded = await auth.validateJWT(token, type);

      if (decoded) {
        
        req.session.jwt = decoded;
        req.session.jwtstring = token;
        req.session.logged = false;

        try {
          req.session.user = await User.findByPk(decoded.id);
        } catch(err) {
          return Controller.serverError(res, err);
        }

        if (req.session.user) {
          req.session.logged = true;
        } 
        return next();
      }

      throw new Error('Invalid Token');
    } catch (err) {
      return Controller.unauthorized(res, err);
    }
  };
}

/*
  Enforces access only to owner
    key: key to compare user id
*/
export function filterOwner(key: string = 'user_id'): RequestHandlerParams {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session == null) {
      req.session = {};
    }
    let id = req.session.jwt.id;
    if (id == null) {
      return Controller.unauthorized(res);
    }
    if (req.session.where == null) {
      req.session.where = {};
    }
    req.session.where[key] = id;
    return next();
  };
}

/*
  Appends user_id to body (useful for enforcing ownership when creating items)
    key: key to add/modify on body
*/
export function appendUser(key: string = 'user_id'): RequestHandlerParams {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session == null) {
      req.session = {};
    }
    let id = req.session.jwt.id;
    if (id == null) {
      return Controller.unauthorized(res);
    }
    if (!req.body) {
      req.body = {};
    }
    req.body[key] = id;
    return next();
  };
}

/*
  Strips nested objects, substituting with their id (if any)
*/
export function stripNestedObjects(): RequestHandlerParams {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
      req.body = {};
    }
    // Iterate through all keys in the body
    for (let key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        // Validate if not from prototype
        if (
          Object.prototype.toString.call(req.body[key]) === '[object Object]'
        ) {
          // Append id and delete original
          if (req.body[key].id !== undefined) {
            req.body[`${key}_id`] = req.body[key].id;
          }
          delete req.body[key];
        }
      }
    }
    return next();
  };
}

/*
  Only allows certain roles to pass
*/
export function filterRoles(roles: string[]): RequestHandlerParams {
  return (req: Request, res: Response, next: NextFunction) => {
    if(!req.session.logged) {
      return Controller.unauthorized(res);
    }
    const role = req.session.jwt.role;
    if (role == null) {
      return Controller.unauthorized(res);
    }
    if (roles.indexOf(role) < 0) {
      return Controller.unauthorized(res);
    }
    return next();
  };
}

/*
  Only allows certain roles to pass
*/
export function onlyLogged(): RequestHandlerParams {
  return (req: Request, res: Response, next: Function) => {
    if (req.session == null) {
      req.session = {};
    }

    if(!req.session.user) {
      return Controller.unauthorized(res);
    }

    return next();
  };
}
