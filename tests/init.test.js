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

const MAX_RETRIES = 10;
const RETRY_DELAY = 300; // milliseconds

global.waitForDBConnection = async () => {
  for (let i = 0; i < MAX_RETRIES; i++) {
    if (dbClient.isAlive()) {
      console.log('DB connection established');
      return;
    }
    console.log('Waiting for DB connection to be established');
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
  throw new Error('Failed to establish DB connection');
};

global.waitForRedisConnection = async () => {
  for (let i = 0; i < MAX_RETRIES; i++) {
    if (redisClient.isAlive()) {
      console.log('Redis connection established');
      return;
    }
    console.log('Waiting for Redis connection to be established');
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
  throw new Error('Failed to establish Redis connection');
};
