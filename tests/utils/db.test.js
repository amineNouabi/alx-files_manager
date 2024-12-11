import dbClient from "../../utils/db";

describe('DB client', () => {

  before(async () => {
    while (!dbClient.isAlive()) {
      console.log('Waiting for DB connection to be established');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    await dbClient.db.collection('test-col').deleteMany({});
  });

  after(async () => {
    await dbClient.db.collection('test-col').deleteMany({});
  });

  it('connects to Mongodb server', async () => {
    expect(dbClient.isAlive()).to.equal(true);
  });

  it('inserts a document', async () => {
    const doc = { name: 'test' };
    const result = await dbClient.db.collection('test-col').insertOne(doc);
    expect(result.insertedCount).to.equal(1);
    await dbClient.db.collection('test-col').deleteOne(doc);
  });

  it('finds a document', async () => {
    const doc = { name: 'test' };
    await dbClient.db.collection('test-col').insertOne(doc);
    const result = await dbClient.db.collection('test-col').findOne(doc);
    expect(result.name).to.equal(doc.name);
    await dbClient.db.collection('test-col').deleteOne(doc);
  });

  it('deletes a document', async () => {
    const doc = { name: 'test' };
    await dbClient.db.collection('test-col').insertOne(doc);
    const result = await dbClient.db.collection('test-col').deleteOne(doc);
    expect(result.deletedCount).to.equal(1);
  });

  it('updates a document', async () => {
    const doc = { name: 'test' };
    await dbClient.db.collection('test-col').insertOne(doc);
    const update = { $set: { name: 'updated' } };
    const result = await dbClient.db.collection('test-col').updateOne(doc, update);
    expect(result.modifiedCount).to.equal(1);
    await dbClient.db.collection('test-col').deleteOne(doc);
  });

  it('deletes all documents', async () => {
    const docs = [];
    for (let i = 0; i < 10; i++) {
      const doc = { name: 'test-deleteAll' };
      docs.push(doc);
      await dbClient.db.collection('test-col').insertOne(doc);
    }
    const result = await dbClient.db.collection('test-col').deleteMany({ name: 'test-deleteAll' });
    expect(result.deletedCount).to.equal(10);
  });

  it('count documents', async () => {
    const docs = [];
    for (let i = 0; i < 10; i++) {
      const doc = { name: 'test-count' };
      docs.push(doc);
      await dbClient.db.collection('test-col').insertOne(doc);
    }
    const count = await dbClient.db.collection('test-col').countDocuments({ name: 'test-count' });
    expect(count).to.equal(10);
  });

});
