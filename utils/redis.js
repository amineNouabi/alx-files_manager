import { createClient } from 'redis';
import { promisify } from 'util';

/**
 * RedisClient class
 *
 * @class RedisClient is a class that manages the connection to the Redis server
 * @constructor no arguments are passed to the constructor
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
    this.client = createClient();

    this.client.on('error', (err) => console.log(`Redis client not connected to the server: ${err.message}`));
    this.client.on('connect', () => console.log('Redis client connected to the server'));

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.expireAsync = promisify(this.client.expire).bind(this.client);
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
    try {
      return this.getAsync(key);
    } catch (err) {
      console.error(`Error getting key ${key}: ${err.message}`);
    }
    return null;
  }

  /**
 * set method for RedisClient
 * Sets a key in the Redis server with a value and expiration time
 * @param {string} key the key to set
 * @param {string} value the value to set the key to
 * @param {number} durationSeconds the expiration time for the key
 * @returns {Promise<string>} the value of the key, or null if the key does not exist
  */
  async set(key, value, durationSeconds) {
    try {
      this.expireAsync(key, durationSeconds);
      return this.setAsync(key, value);
    } catch (err) {
      console.error(`Error setting key ${key}: ${err.message}`);
    }
    return null;
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
