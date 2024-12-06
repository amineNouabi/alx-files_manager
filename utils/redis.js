import { createClient } from 'redis';
import { promisify } from 'util';

export class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => console.log(`Redis client not connected to the server: ${err.message}`));
    this.client.on('connect', () => console.log('Redis client connected to the server'));

    this.getAsync = promisify(this.client.get).bind(this);
    this.setAsync = promisify(this.client.set).bind(this);
    this.expireAsync = promisify(this.client.expire).bind(this);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    try {
      return await this.getAsync(key);
    } catch (err) {
      console.error(`Error getting key ${key}: ${err.message}`);
    }
    return null;
  }

  async set(key, value, durationSeconds) {
    try {
      return (await this.setAsync(key, value)) && (await this.expireAsync(key, durationSeconds));
    } catch (err) {
      console.error(`Error setting key ${key}: ${err.message}`);
    }
    return null;
  }

  async del(key) {
    return this.client.del(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
