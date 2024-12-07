import dbClient from '../utils/db';
import redisClient from '../utils/redis';

/**
 * @class AppController
 * @method getStatus - GET `/status` endpoint that returns the status of the API.
 * @method getStats - GET `/stats` endpoint that returns the number of users and files in the DB.
 */
export default class AppController {
  static getStatus(req, res) {
    res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static async getStats(req, res) {
    res.status(200).json({ users: await dbClient.nbUsers(), files: await dbClient.nbFiles() });
  }
}
