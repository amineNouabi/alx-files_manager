import { expect } from 'chai';

describe('dB client', () => {
  before(async () => {
    await dbClient.db.collection('tests').deleteMany({});
  });

  after(async () => {
    await dbClient.db.collection('tests').deleteMany({});
  });

  it('connects to Mongodb server', async () => {
    expect.assertions(1);
    // eslint-disable-next-line no-unused-expressions
    expect(dbClient.isAlive()).to.be.true;
  });

  it('nbUsers method', async () => {
    const nbUsers = await dbClient.nbUsers();
    expect(nbUsers).to.be.a('number');
    expect(nbUsers).to.equal(await dbClient.users.countDocuments());
  });

  it('nbFiles method', async () => {
    const nbFiles = await dbClient.nbFiles();
    expect(nbFiles).to.be.a('number');
    expect(nbFiles).to.equal(await dbClient.files.countDocuments());
  });

  it('inserts a document', async () => {
    const doc = { name: 'test' };
    const result = await dbClient.db.collection('tests').insertOne(doc);
    expect(result.insertedCount).to.equal(1);
    await dbClient.db.collection('tests').deleteOne(doc);
  });

  it('finds a document', async () => {
    const doc = { name: 'test' };
    await dbClient.db.collection('tests').insertOne(doc);
    const result = await dbClient.db.collection('tests').findOne(doc);
    expect(result.name).to.equal(doc.name);
    await dbClient.db.collection('tests').deleteOne(doc);
  });

  it('deletes a document', async () => {
    const doc = { name: 'test' };
    await dbClient.db.collection('tests').insertOne(doc);
    const result = await dbClient.db.collection('tests').deleteOne(doc);
    expect(result.deletedCount).to.equal(1);
  });

  it('updates a document', async () => {
    const doc = { name: 'test' };
    await dbClient.db.collection('tests').insertOne(doc);
    const update = { $set: { name: 'updated' } };
    const result = await dbClient.db.collection('tests').updateOne(doc, update);
    expect(result.modifiedCount).to.equal(1);
    await dbClient.db.collection('tests').deleteOne(doc);
  });
});
