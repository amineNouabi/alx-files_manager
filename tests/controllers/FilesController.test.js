/* eslint-disable  */
import { expect } from 'chai';
import {
	existsSync, readFileSync, readdirSync, unlinkSync,
} from 'fs';

import { ObjectId } from 'mongodb';
import { resolve } from 'path';
import sha1 from 'sha1';
import config from '../../utils/config';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';

describe('files controller', () => {
  const dummyUser = { email: 'test@test.com', password: 'test' };
  let user;
  let token;

  afterEach(async () => {
    await dbClient.files.deleteMany({});
    readdirSync(resolve(config.FOLDER_PATH)).forEach((file) => unlinkSync(resolve(config.FOLDER_PATH, file)));
  });

  before(async () => {
    await dbClient.users.deleteMany({ email: dummyUser.email });
    await redisClient.client.flushall('ASYNC');
  });

  after(async () => {
    await dbClient.users.deleteMany({ email: dummyUser.email });
    await redisClient.client.flushall('ASYNC');
  });

  it('pOST /files - Unauthorized', async () => {
    const res = await request.post('/files');
    expect(res.status).to.equal(401);
    expect(res.body).to.have.keys('error');
    expect(res.body.error).to.equal('Unauthorized');

    const res2 = await request.post('/files').set('X-Token', 'invalid');
    expect(res2.status).to.equal(401);
    expect(res2.body).to.have.keys('error');
    expect(res2.body.error).to.equal('Unauthorized');

    user = (await dbClient.users.insertOne({ email: dummyUser.email, password: sha1(dummyUser.password) })).ops[0];

    const connect_res = await request.get('/connect').auth(dummyUser.email, dummyUser.password, { type: 'basic' });
    expect(connect_res.status).to.equal(200);
    expect(connect_res.body).to.have.keys('token');
    expect(connect_res.body.token).to.be.a('string');
    token = connect_res.body.token;
  });

  it('pOST /files - Missing name', async () => {
    const res = await request.post('/files').set('X-Token', token).send({});
    expect(res.status).to.equal(400);
    expect(res.body).to.have.keys('error');
    expect(res.body.error).to.equal('Missing name');

    const res2 = await request.post('/files').set('X-Token', token).send({ type: 'file' });
    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.keys('error');
    expect(res2.body.error).to.equal('Missing name');

    const res3 = await request.post('/files').set('X-Token', token).send({ type: 'file', data: 'data' });
    expect(res3.status).to.equal(400);
    expect(res3.body).to.have.keys('error');
    expect(res3.body.error).to.equal('Missing name');
  });

  it('pOST /files - (Missing | invalid) type', async () => {
    const res2 = await request.post('/files').set('X-Token', token).send({ name: 'test' });
    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.keys('error');
    expect(res2.body.error).to.equal('Missing type');

    const res3 = await request.post('/files').set('X-Token', token).send({ name: 'test', type: 'invalid' });
    expect(res3.status).to.equal(400);
    expect(res3.body).to.have.keys('error');
    expect(res3.body.error).to.equal('Missing type');
  });

  it('pOST /files - Missing data for (file | image)', async () => {
    const res2 = await request.post('/files').set('X-Token', token).send({ name: 'test', type: 'file' });
    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.keys('error');
    expect(res2.body.error).to.equal('Missing data');

    const res3 = await request.post('/files').set('X-Token', token).send({ name: 'test', type: 'image' });
    expect(res3.status).to.equal(400);
    expect(res3.body).to.have.keys('error');
    expect(res3.body.error).to.equal('Missing data');
  });

  it('pOST /files - Parent (not found | not a folder)', async () => {
    const parentId = '5f9d88b2f3f6e5d3a5e6c7e8';
    const existingFile = await dbClient.files.findOne({ _id: parentId });
    expect(existingFile).to.be.null;

    const res = await request.post('/files').set('X-Token', token).send({ name: 'test', type: 'folder', parentId });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.keys('error');
    expect(res.body.error).to.equal('Parent not found');

    const tempFile = await dbClient.files.insertOne({ name: 'test', type: 'file' });
    const res2 = await request.post('/files').set('X-Token', token).send({ name: 'test', type: 'folder', parentId: tempFile.insertedId });
    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.keys('error');
    expect(res2.body.error).to.equal('Parent is not a folder');
    await dbClient.files.deleteOne({ _id: tempFile.insertedId });
  });

  it('pOST /files - Success', async () => {
    const res = await request.post('/files').set('X-Token', token).send({ name: 'test', type: 'folder' });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.keys('id', 'userId', 'name', 'type', 'isPublic', 'parentId');
    expect(res.body.id).to.be.a('string');
    expect(res.body.userId).to.be.a('string');
    expect(res.body.name).to.equal('test');
    expect(res.body.type).to.equal('folder');
    expect(res.body.isPublic).to.be.false;
    expect(res.body.parentId).to.equal(0);

    const res2 = await request.post('/files').set('X-Token', token).send({
      name: 'test.txt', type: 'file', data: 'SGVsbG8gV2Vic3RhY2shCg==', parentId: res.body.id,
    });
    expect(res2.status).to.equal(201);
    expect(res2.body).to.have.keys('id', 'userId', 'name', 'type', 'isPublic', 'parentId');
    expect(res2.body.id).to.be.a('string');
    expect(res2.body.userId).to.be.a('string');
    expect(res2.body.name).to.equal('test.txt');
    expect(res2.body.type).to.equal('file');
    expect(res2.body.isPublic).to.be.false;
    expect(res2.body.parentId).to.equal(res.body.id);

    const file = await dbClient.files.findOne({ _id: new ObjectId(res2.body.id) });
    expect(file).to.not.be.null;
    expect(existsSync(resolve(file.localPath))).to.be.true;
    expect(readFileSync(resolve(file.localPath), { encoding: 'utf-8' }).trim()).to.equal('Hello Webstack!');
  });

  it('gET /files - Unauthorized', async () => {
    const res = await request.get('/files');
    expect(res.status).to.equal(401);
    expect(res.body).to.have.keys('error');
    expect(res.body.error).to.equal('Unauthorized');

    const res2 = await request.get('/files').set('X-Token', 'invalid');
    expect(res2.status).to.equal(401);
    expect(res2.body).to.have.keys('error');
    expect(res2.body.error).to.equal('Unauthorized');
  });

  it('gET /files - no parentId and no page', async () => {
    const res = await request.get('/files').set('X-Token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body).to.be.empty;
  });

  it('gET /files - parentId not linked', async () => {
    const parentId = '5f9d88b2f3f6e5d3a5e6c7e8';
    const existingFile = await dbClient.files.findOne({ _id: parentId });
    expect(existingFile).to.be.null;

    const res = await request.get('/files').set('X-Token', token).query({ parentId });
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body).to.be.empty;
  });

  it('gET /files -  with no parentId and no page', async () => {
    const initialFiles = [];

    for (let i = 0; i < 25; i += 1) {
      const item = {
        userId: new ObjectId(user._id),
        name: Math.random().toString(36).substring(7),
        type: 'folder',
        parentId: '0',
      };
      const createdFileDocs = await dbClient.files.insertOne(item);
      if (createdFileDocs && createdFileDocs.ops.length > 0) {
        item.id = createdFileDocs.ops[0]._id.toString();
      }
      initialFiles.push(item);
    }

    const res = await request.get('/files').set('X-Token', token);
    expect(res).to.have.status(200);

    const resList = res.body;
    expect(resList.length).to.equal(20);

    resList.forEach((item) => {
      const itemIdx = initialFiles.findIndex((i) => i.id == item.id);
      assert.isAtLeast(itemIdx, 0);

      const itemInit = initialFiles.splice(itemIdx, 1)[0];
      expect(itemInit).to.not.be.null;

      expect(itemInit.id).to.equal(item.id);
      expect(itemInit.name).to.equal(item.name);
      expect(itemInit.type).to.equal(item.type);
      expect(itemInit.parentId).to.equal(item.parentId);
    });

    expect(initialFiles.length).to.equal(5);
  });

  it('gET /files - no parentId and second page', async () => {
    const initialFiles = [];

    for (let i = 0; i < 25; i += 1) {
      const item = {
        userId: new ObjectId(user._id),
        name: Math.random().toString(36).substring(7),
        type: 'folder',
        parentId: '0',
      };
      const createdFileDocs = await dbClient.files.insertOne(item);
      if (createdFileDocs && createdFileDocs.ops.length > 0) {
        item.id = createdFileDocs.ops[0]._id.toString();
      }
      initialFiles.push(item);
    }

    const res = await request.get('/files').set('X-Token', token).query({ page: 1 });
    expect(res).to.have.status(200);

    const resList = res.body;
    expect(resList.length).to.equal(5);

    resList.forEach((item) => {
      const itemIdx = initialFiles.findIndex((i) => i.id == item.id);
      assert.isAtLeast(itemIdx, 0);

      const itemInit = initialFiles.splice(itemIdx, 1)[0];
      expect(itemInit).to.not.be.null;

      expect(itemInit.id).to.equal(item.id);
      expect(itemInit.name).to.equal(item.name);
      expect(itemInit.type).to.equal(item.type);
      expect(itemInit.parentId).to.equal(item.parentId);
    });

    expect(initialFiles.length).to.equal(20);
  });

  it('put /files/:id/publish - Unauthorized', async () => {
    const res = await request.put('/files/5f9d88b2f3f6e5d3a5e6c7e8/publish');
    expect(res.status).to.equal(401);
    expect(res.body).to.have.keys('error');
    expect(res.body.error).to.equal('Unauthorized');

    const res2 = await request.put('/files/5f9d88b2f3f6e5d3a5e6c7e8/publish').set('X-Token', 'invalid');
    expect(res2.status).to.equal(401);
    expect(res2.body).to.have.keys('error');
    expect(res2.body.error).to.equal('Unauthorized');
  });

  it('put /files/:id/publish - file not found', async () => {
    const res = await request.put('/files/5f9d88b2f3f6e5d3a5e6c7e8/publish').set('X-Token', token);
    expect(res.status).to.equal(404);
    expect(res.body).to.have.keys('error');
    expect(res.body.error).to.equal('Not found');
  });

  it('put /files/:id/publish - Success', async () => {
    const file = await dbClient.files.insertOne({ userId: new ObjectId(user._id), name: 'test', type: 'folder', parentId: "0"});
    const res = await request.put(`/files/${file.insertedId}/publish`).set('X-Token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys('id', 'userId', 'name', 'type', 'isPublic', 'parentId');
    expect(res.body.id).to.be.a('string');
    expect(res.body.userId).to.be.a('string');
    expect(res.body.userId).to.equal(user._id.toString());
    expect(res.body.name).to.equal('test');
    expect(res.body.type).to.equal('folder');
    expect(res.body.isPublic).to.be.true;
    expect(res.body.parentId).to.equal("0");
  });

  it('put /files/:id/publish - File already public', async () => {
    const file = await dbClient.files.insertOne({ userId: new ObjectId(user._id), name: 'test', type: 'folder', parentId: "0", isPublic: true });

    const fileFromApi = await request.get(`/files/${file.insertedId}`).set('X-Token', token);
    expect(fileFromApi.status).to.equal(200);
    expect(fileFromApi.body.isPublic).to.be.true;

    const res = await request.put(`/files/${file.insertedId}/publish`).set('X-Token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys('id', 'userId', 'name', 'type', 'isPublic', 'parentId');
    expect(res.body.id).to.be.a('string');
    expect(res.body.userId).to.be.a('string');
    expect(res.body.userId).to.equal(user._id.toString());
    expect(res.body.name).to.equal('test');
    expect(res.body.type).to.equal('folder');
    expect(res.body.isPublic).to.be.true;
    expect(res.body.parentId).to.equal("0");
  });

  it('put /files/:id/publish - usecase', async () => {
    const file = await dbClient.files.insertOne({ userId: new ObjectId(user._id), name: 'test', type: 'folder', parentId: "0", isPublic: false });
    const fileFromApi = await request.get(`/files/${file.insertedId}`).set('X-Token', token);
    expect(fileFromApi.status).to.equal(200);
    expect(fileFromApi.body.isPublic).to.be.false;

    const res = await request.put(`/files/${ file.insertedId }/publish`).set('X-Token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys('id', 'userId', 'name', 'type', 'isPublic', 'parentId');
    expect(res.body.id).to.be.a('string');
    expect(res.body.userId).to.be.a('string');
    expect(res.body.userId).to.equal(user._id.toString());
    expect(res.body.name).to.equal('test');
    expect(res.body.type).to.equal('folder');
    expect(res.body.isPublic).to.be.true;
    expect(res.body.parentId).to.equal("0");

    const fileFromApi2 = await request.get(`/files/${file.insertedId}`).set('X-Token', token);
    expect(fileFromApi2.status).to.equal(200);
    expect(fileFromApi2.body.isPublic).to.be.true;

  });

  it('put /files/:id/unpublish - Unauthorized', async () => {
    const res = await request.put('/files/5f9d88b2f3f6e5d3a5e6c7e8/unpublish');
    expect(res.status).to.equal(401);
    expect(res.body).to.have.keys('error');
    expect(res.body.error).to.equal('Unauthorized');

    const res2 = await request.put('/files/5f9d88b2f3f6e5d3a5e6c7e8/unpublish').set('X-Token', 'invalid');
    expect(res2.status).to.equal(401);
    expect(res2.body).to.have.keys('error');
    expect(res2.body.error).to.equal('Unauthorized');
  });

  it('put /files/:id/unpublish - file not found', async () => {
    const res = await request.put('/files/5f9d88b2f3f6e5d3a5e6c7e8/unpublish').set('X-Token', token);
    expect(res.status).to.equal(404);
    expect(res.body).to.have.keys('error');
    expect(res.body.error).to.equal('Not found');
  });

  it('put /files/:id/unpublish - Success', async () => {
    const file = await dbClient.files.insertOne({ userId: new ObjectId(user._id), name: 'test', type: 'folder', parentId: "0", isPublic: true });
    const res = await request.put(`/files/${file.insertedId}/unpublish`).set('X-Token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys('id', 'userId', 'name', 'type', 'isPublic', 'parentId');
    expect(res.body.id).to.be.a('string');
    expect(res.body.userId).to.be.a('string');
    expect(res.body.userId).to.equal(user._id.toString());
    expect(res.body.name).to.equal('test');
    expect(res.body.type).to.equal('folder');
    expect(res.body.isPublic).to.be.false;
    expect(res.body.parentId).to.equal("0");
});

  it('put /files/:id/unpublish - usecase', async () => {
    const file = await dbClient.files.insertOne({ userId: new ObjectId(user._id), name: 'test', type: 'folder', parentId: "0", isPublic: true });
    const fileFromApi = await request.get(`/files/${file.insertedId}`).set('X-Token', token);
    expect(fileFromApi.status).to.equal(200);
    expect(fileFromApi.body.isPublic).to.be.true;

    const res = await request.put(`/files/${ file.insertedId }/unpublish`).set('X-Token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys('id', 'userId', 'name', 'type', 'isPublic', 'parentId');
    expect(res.body.id).to.be.a('string');
    expect(res.body.userId).to.be.a('string');
    expect(res.body.userId).to.equal(user._id.toString());
    expect(res.body.name).to.equal('test');
    expect(res.body.type).to.equal('folder');
    expect(res.body.isPublic).to.be.false;
    expect(res.body.parentId).to.equal("0");

    const fileFromApi2 = await request.get(`/files/${file.insertedId}`).set('X-Token', token);
    expect(fileFromApi2.status).to.equal(200);
    expect(fileFromApi2.body.isPublic).to.be.false;
  });



});
