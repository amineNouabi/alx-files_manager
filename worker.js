import Queue from 'bull/lib/queue';
import { writeFile } from 'fs';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import { resolve } from 'path';
import { promisify } from 'util';
import dbClient from './utils/db';

const fileQueue = new Queue('image thumbnails');
const writeFileAsync = promisify(writeFile);

fileQueue.process(async (job, done) => {
  console.log('Starting thumbnail generation');

  const { fileId, userId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.files.findOne({ _id: new ObjectId(fileId) });

  if (!file) throw new Error('File not found');

  console.log(file);

  const SIZES = [500, 250, 100];
  const filePath = resolve(file.localPath);

  Promise.all(SIZES.map((size) => {
    const thumbnail = imageThumbnail(filePath, { width: size });
    return writeFileAsync(`${filePath}_${size}`, thumbnail);
  }))
    .then(() => {
      done();
    });
});
