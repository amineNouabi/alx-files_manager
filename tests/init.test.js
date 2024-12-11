import chai from 'chai';
import chaiHttp from 'chai-http';
import supertest from 'supertest';
import app from '../server';

chai.use(chaiHttp);
chai.should();

global.app = app;
global.request = supertest(app);
global.expect = chai.expect;
global.assert = chai.assert;
