import { writeFile } from 'fs';
import { ObjectId } from 'mongodb';
import { join } from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import config from '../utils/config';
import dbClient from '../utils/db';

export const SUPPORTED_TYPES = ['folder', 'file', 'image'];

const writeFileAsync = promisify(writeFile);

export default class FilesController {
  static async postUpload(req, res) {
    const {
      name, type, parentId, isPublic, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !SUPPORTED_TYPES.includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (!data && ['file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing data' });

    if (parentId) {
      const parent = await dbClient.files.findOne({ _id: new ObjectId(parentId) });
      if (!parent) return res.status(400).json({ error: 'Parent not found' });
      if (parent.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const newFile = {
      userId: req.user._id,
      name,
      type,
      parentId: parentId || 0,
      isPublic: isPublic || false,
    };

    if (type !== 'folder') {
      const localPath = join(config.FOLDER_PATH, uuidv4());
      await writeFileAsync(localPath, Buffer.from(data, 'base64'));
      newFile.localPath = localPath;
    }

    const result = await dbClient.files.insertOne(newFile);
    return res.status(201).json(
      {
        id: result.insertedId.toString(),
        userId: result.ops[0].userId,
        name: result.ops[0].name,
        type: result.ops[0].type,
        isPublic: result.ops[0].isPublic,
        parentId: result.ops[0].parentId,
      },
    );
  }
}
