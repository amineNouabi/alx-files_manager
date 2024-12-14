import { writeFile } from 'fs';
import { ObjectId } from 'mongodb';
import { join } from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import config from '../utils/config';
import dbClient from '../utils/db';

export const RECORDS_PER_PAGE = 20;
export const SUPPORTED_TYPES = ['folder', 'file', 'image'];

const writeFileAsync = promisify(writeFile);

export default class FilesController {
  static async postUpload(req, res) {
    const { name, type, data } = req.body;
    const parentId = req.body.parentId && req.body.parentId !== '0' && req.body.parentId !== 0 ? new ObjectId(req.body.parentId) : 0;
    const isPublic = !!req.body.isPublic;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !SUPPORTED_TYPES.includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (!data && ['file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing data' });

    if (parentId) {
      const parent = await dbClient.files.findOne({ _id: parentId });
      if (!parent) return res.status(400).json({ error: 'Parent not found' });
      if (parent.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const newFile = {
      userId: req.user._id,
      name,
      type,
      parentId,
      isPublic,
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

  static async getIndex(req, res) {
    const parentId = req.query.parentId && req.query.parentId !== '0' ? new ObjectId(req.query.parentId) : '0';
    let page;

    try {
      page = parseInt(req.query.page, 10) || 0;
    } catch (e) {
      page = 0;
    }

    const files = await dbClient.files.find({
      parentId,
      userId: req.user._id,
    }).skip(page * RECORDS_PER_PAGE)
      .limit(RECORDS_PER_PAGE)
      .toArray();

    return res.status(200).json(files.map((file) => ({
      id: file._id.toString(),
      userId: file.userId.toString(),
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    })));
  }

  static async getShow(req, res) {
    const { id: fileId } = req.params;

    const file = await dbClient.files.findOne(
      {
        _id: new ObjectId(fileId),
        userId: req.user._id,
      },
    );

    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async putPublish(req, res) {
    const { id: fileId } = req.params;
    const { user } = req;

    const file = await dbClient.files.findOne({
      _id: new ObjectId(fileId),
      userId: user._id,
    });

    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.files.updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { isPublic: true } },
    );

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const { id: fileId } = req.params;
    const { user } = req;

    const file = await dbClient.files.findOne({
      _id: new ObjectId(fileId),
      userId: user._id,
    });

    await dbClient.files.updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { isPublic: false } },
    );

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId,
    });
  }

  static async getFile(req, res) {
    const { id: fileId } = req.params;

    const file = await dbClient.files.findOne({
      _id: new ObjectId(fileId),
    });

    if (!file) return res.status(404).json({ error: 'Not found' });

    if (!file.isPublic && !req.user) return res.status(403).json({ error: 'Not authorized' });

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }
}
