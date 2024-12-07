import sha1 from 'sha1';
import dbClient from '../utils/db';

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    try {
      const existingUser = await dbClient.users.findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'Already exist' });
      const hashedPassword = sha1(password);
      const result = await dbClient.users.insertOne({ email, password: hashedPassword });
      return res.status(201).json({ id: result.insertedId, email });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async getMe(req, res) {
    return res.json({ id: req.user._id.toString(), email: req.user.email });
  }
}
