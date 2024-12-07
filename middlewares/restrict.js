import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

/**
 * Middleware to restrict Auth to routes that require authentication
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 *
 */
export default async function restrictAuth(req, res, next) {
  if (!req.headers['x-token']) return res.status(401).json({ error: 'Unauthorized' });
  const xToken = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${xToken}`);
  if (!userId) res.status(401).json({ error: 'Unauthorized' });
  const user = await dbClient.users.findOne({ _id: new ObjectId(userId) });
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  return next();
}
