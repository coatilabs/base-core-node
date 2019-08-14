// Import the dependencies for testing
var path = require('path');
var dotEnvPath = path.resolve('./.env.test');
require('dotenv').config({ path: dotEnvPath });
import { app } from '../../../server';

import 'mocha';
import * as chai from 'chai';
import chaiHttp = require('chai-http');

// Configure chai
chai.use(chaiHttp);
chai.should();

describe('AuthController', () => {
  it('should register a user', done => {
    chai
      .request(app)
      .post('/api/v1/auth/register')
      .set('content-type', 'application/json')
      .send({
        email: 'email@coatilabs.com',
        password: 'password',
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  }).timeout(8000);

  it('should login a user', done => {
    chai
      .request(app)
      .post('/api/v1/auth/login')
      .set('content-type', 'application/json')
      .send({
        email: 'email@coatilabs.com',
        password: 'password',
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  }).timeout(8000);

  it('should fail login a user', done => {
    chai
      .request(app)
      .post('/api/v1/auth/login')
      .set('content-type', 'application/json')
      .send({
        email: 'email@coatilabs.com',
        password: 'passwod',
      })
      .end((err, res) => {
        res.should.have.status(401);
        res.body.should.be.a('object');
        done();
      });
  }).timeout(8000);
});
