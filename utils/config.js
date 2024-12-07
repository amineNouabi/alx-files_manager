import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Configuration object
 * @type {Object}
 * @property {string} PORT - the port to listen on
 * @property {string} ENV_DB_HOST - the database host
 * @property {string} ENV_DB_PORT - the database port
 * @property {string} ENV_DB_DATABASE - the database name
 * @property {string} ENV_DB_URI - the database URI
 * @property {string} ENV_REDIS_HOST - the Redis host
 * @property {string} ENV_REDIS_PORT - the Redis port
 * @property {string} ENV_REDIS_URI - the Redis URI
 */
const config = {};
/**
 * Load environment variables from a .env file
 * @param {string} path - the path to the .env file
 */
function loadEnv(path) {
  if (!existsSync(path)) {
    return;
  }
  const dotenvContent = readFileSync(path, 'utf-8');

  dotenvContent.trim().split('\n').forEach((line) => {
    if (line && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value) config[key] = value;
    }
  });
}

loadEnv(resolve('.env'));

export default config;
