
describe('DB client', () => {

  it('connects to Mongodb server',async () => {
    setTimeout(() => {
      expect(dbClient.isAlive()).to.equal(true);
    }, 1000);
  });

  it('inserts a document', async () => {
    const doc = { name: 'test' };
    const result = await dbClient.db.collection('test').insertOne('documents', doc);
    expect(result).to.equal(true);
  });

  it('finds a document', async () => {
    const doc = { name: 'test' };
    await dbClient.db.collection('test').insertOne('documents', doc);
    const result = await dbClient.db.collection('test').findOne('documents', doc);
    expect(result).to.equal(doc);
  });

  it('deletes a document', async () => {
    const doc = { name: 'test' };
    await dbClient.db.collection('test').insertOne('documents', doc);
    const result = await dbClient.db.collection('test').deleteOne('documents', doc);
    expect(result).to.equal(true);
  });

  it('updates a document', async () => {
    const doc = { name: 'test' };
    await dbClient.db.collection('test').insertOne('documents', doc);
    const update = { name: 'updated' };
    const result = await dbClient.db.collection('test').updateOne('documents', doc, update);
    expect(result).to.equal(true);
  });

  it('deletes all', async () => {
    const docs = [];
    for (let i = 0; i < 10; i++) {
      const doc = { name: 'test' };
      docs.push(doc);
      await dbClient.db.collection('test').insertOne('documents', doc);
    }
    const result = await dbClient.db.collection('test').deleteMany('documents', {});
    expect(result).to.equal(true);
  });

});
