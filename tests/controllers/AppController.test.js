import { expect } from 'chai';
import dbClient from '../../utils/db';

describe('app controller', () => {
  it('get /status', async () => {
    expect.hasAssertions(4);
    const res = await request.get('/status');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys('redis', 'db');
    expect(res.body.redis).to.be.true;
    expect(res.body.db).to.be.true;
  });

  it('get /stats', async () => {
    const res = await request.get('/stats');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.keys('users', 'files');
    expect(res.body.users).to.be.a('number');
    expect(res.body.files).to.be.a('number');
    expect(res.body.users).to.equal(await dbClient.nbUsers());
    expect(res.body.files).to.equal(await dbClient.nbFiles());
  });
});
