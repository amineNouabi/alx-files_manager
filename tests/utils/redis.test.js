import { before } from 'node:test';
import { v4 as uuidv4 } from 'uuid';

describe('redis client', () => {

  before(async () => {
    await redisClient.client.flushall('ASYNC');
  });

  after(async () => {
    await redisClient.client.flushall('ASYNC');
  });

  it('connects to Redis server',async () => {
    setTimeout(() => {
      expect(redisClient.isAlive()).to.equal(true);
    }, 1000);
  });

  it('sets a value', async () => {
    const key = uuidv4();
    const value = uuidv4();
    await redisClient.set(key, value);
    expect(await redisClient.get(key)).to.equal(value);
  });

  it('gets a value', async () => {
    const key = uuidv4();
    const value = uuidv4();
    redisClient.client.set(key, value);
    expect(await redisClient.get(key)).to.equal(value);
  });

  it('deletes a value', async () => {
    const key = uuidv4();
    const value = uuidv4();
    await redisClient.set(key, value);
    await redisClient.del(key);
    expect(await redisClient.get(key)).to.equal(null);
  });

  it('expires a value', async () => {
      const key = uuidv4();
      const value = uuidv4();
      await redisClient.set(key, value, 3);
      setTimeout(async () => {
        expect(await redisClient.get(key)).to.equal(value)
    }, 2000);

    await redisClient.set(key, value, 1);
    setTimeout(async () => {
      expect(await redisClient.get(key)).to.equal(null);
    }, 1000);
  });

  it('delete all', async () => {
    const keys = [];
    const values = [];
    for (let i = 0; i < 10; i++) {
      const key = uuidv4();
      const value = uuidv4();
      keys.push(key);
      values.push(value);
      await redisClient.set(key, value);
    }

    await redisClient.client.flushall();
    for (let i = 0; i < 10; i++) {
      expect(await redisClient.get(keys[i])).to.equal(null);
    }
  });
});
