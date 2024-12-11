import { MongoClient } from 'mongodb';

import config from './config';

const DB_HOST = config.DB_HOST || 'localhost';
const DB_PORT = config.DB_PORT || 27017;
const DB_DATABASE = config.DB_DATABASE || 'files_manager';
const DB_URI = config.DB_URI || `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;

export class DBClient {
  constructor() {
      MongoClient.connect(DB_URI, {
        useUnifiedTopology: true,
      },  (err, client) => {
        if (err)  throw err;
        this.client = client;
        this.db = client.db(DB_DATABASE);
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      });
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    return this.users.countDocuments();
  }

  async nbFiles() {
    return this.files.countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
