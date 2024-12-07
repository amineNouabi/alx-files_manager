import redis from 'redis';
import { promisify } from 'util';

// eslint-disable-next-line import/no-unresolved
import { REDIS_HOST as ENV_REDIS_HOST, REDIS_PORT as ENV_REDIS_PORT, REDIS_URI as ENV_REDIS_URI } from '@env';

const REDIS_HOST = ENV_REDIS_HOST || 'localhost';
const REDIS_PORT = ENV_REDIS_PORT || 6379;

const REDIS_URI = ENV_REDIS_URI || `redis://${REDIS_HOST}:${REDIS_PORT}`;

/**
 * @class RedisClient is a class that manages the connection to the Redis server
 *
 * @constructor no arguments are passed to the constructor
 * @property {redis.RedisClient} client the Redis client that connects to the server
 * @method isAlive() checks if the Redis client is connected to the server
 * @method get(key) retrieves the value of a key from the Redis server
 * @method set(key,value,durationSeconds) sets a key in the Redis server
 *                                      with a value and expiration time
 * @method del(key) deletes a key from the Redis server
 */

export class RedisClient {
/**
 * Constructor for RedisClient
 */
  constructor() {
    this.client = redis.createClient({
      url: REDIS_URI,
      tls: ENV_REDIS_URI ? {} : undefined,
    });

    this.getAsync = promisify(this.client.get).bind(this.client);

    this.client.on('error', (err) => console.log(`Redis client not connected to the server: ${err.message}`));
    this.client.on('connect', () => {
    //   console.log('Redis client connected to the server');
    });
  }

  /**
 * isAlive method for RedisClient
 * Checks if the client is connected to the server
 * @returns {boolean} true if the client is connected to the server, false otherwise
 */
  isAlive() {
    return this.client.connected;
  }

  /**
 * get method for RedisClient
 * Retrieves the value of a key from the Redis server
 * @param {string} key the key to retrieve the value of
 * @returns {Promise<string>} the value of the key, or null if the key does not exist
 */
  async get(key) {
    return this.getAsync(key);
  }

  /**
 * set method for RedisClient
 * Sets a key in the Redis server with a value and expiration time
 * @param {string} key the key to set
 * @param {string} value the value to set the key to
 * @param {number} durationSeconds the expiration time for the key
 * @returns {Promise<string>} the value of the key
  */
  async set(key, value, durationSeconds) {
    return this.client.setex(key, durationSeconds, value);
  }

  /**
 * del method for RedisClient
 * Deletes a key from the Redis server
 * @param {string} key the key to delete
 * @returns {Promise<number>} the number of keys deleted
 */
  async del(key) {
    return this.client.del(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
