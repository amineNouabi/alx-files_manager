import sha1 from 'sha1';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    if (!req.headers.authorization || typeof req.headers.authorization !== 'string' || req.headers.authorization.indexOf('Basic ') === -1) { return res.status(401).json({ error: 'Unauthorized' }); }

    const base64Credentials = req.headers.authorization.split(' ')[1];
    const [email, password] = Buffer.from(base64Credentials, 'base64').toString('utf-8').split(':');
    if (!email || !password) { return res.status(401).json({ error: 'Unauthorized' }); }

    const user = await dbClient.users.findOne({ email, password: sha1(password) });
    if (!user) { return res.status(401).json({ error: 'Unauthorized' }); }

    const token = v4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) { return res.status(401).json({ error: 'Unauthorized' }); }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) { return res.status(401).json({ error: 'Unauthorized' }); }

    await redisClient.del(key);
    return res.status(204).end();
  }

  static async getMe(req, res) {
    return res.status(200).send('GET /me');
  }
}
