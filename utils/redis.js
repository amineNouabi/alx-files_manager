import { createClient } from 'redis';
import { promisify } from 'util';

export class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => console.log(`Redis client not connected to the server: ${err.message}`));
    this.client.on('connect', () => console.log('Redis client connected to the server'));

    this.getAsync = promisify(this.client.get).bind(this);
    this.setAsync = promisify(this.client.set).bind(this);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return (this.getAsync(key));
  }

  async set(key, value, durationSeconds) {
    return (await this.setAsync(key, value)) && (this.client.expire(key, durationSeconds));
  }

  async del(key) {
    return this.client.del(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
