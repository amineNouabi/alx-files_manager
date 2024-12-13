import chai from 'chai';
import chaiHttp from 'chai-http';
import supertest from 'supertest';
import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

chai.use(chaiHttp);
chai.should();

global.app = app;
global.request = supertest(app);
global.expect = chai.expect;
global.assert = chai.assert;
global.dbClient = dbClient;
global.redisClient = redisClient;
