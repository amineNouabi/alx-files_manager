import { existsSync, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

/**
 * Configuration object
 * @type {Object}
 * @property {string} PORT - the port to listen on
 * @property {string} DB_HOST - the database host
 * @property {string} DB_PORT - the database port
 * @property {string} DB_DATABASE - the database name
 * @property {string} DB_URI - the database URI
 * @property {string} REDIS_HOST - the Redis host
 * @property {string} REDIS_PORT - the Redis port
 * @property {string} REDIS_URI - the Redis URI
 */
const config = {
  FOLDER_PATH: `${process.env.FOLDER_PATH || ''}`.trim() || join(tmpdir(), 'files_manager'),
};

if (!existsSync(config.FOLDER_PATH)) mkdirSync(config.FOLDER_PATH, { recursive: true });

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
