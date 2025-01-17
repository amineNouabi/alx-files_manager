import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

/**
 * Middleware to bind User to request object.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 *
 */
export default async function bindUser(req, res, next) {
  req.user = null;
  if (!req.headers['x-token']) return next();

  const xToken = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${xToken}`);
  if (!userId) return next();

  const user = await dbClient.users.findOne({ _id: new ObjectId(userId) });
  if (user) req.user = user;
  return next();
}
