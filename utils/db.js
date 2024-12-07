import { MongoClient } from 'mongodb';

// eslint-disable-next-line import/no-unresolved
// import {
//  DB_DATABASE as ENV_DB_DATABASE,
//  DB_HOST as ENV_DB_HOST,
//  DB_PORT as ENV_DB_PORT,
//  DB_URI as ENV_DB_URI,
// } from '@env';
const ENV_DB_HOST = null;
const ENV_DB_PORT = null;
const ENV_DB_DATABASE = null;
const ENV_DB_URI = null;

const DB_HOST = ENV_DB_HOST || 'localhost';
const DB_PORT = ENV_DB_PORT || 27017;
const DB_DATABASE = ENV_DB_DATABASE || 'files_manager';
const DB_URI = ENV_DB_URI || `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;

export class DBClient {
  constructor() {
    try {
      this.client = new MongoClient(DB_URI, {
        useUnifiedTopology: true,
      });
      this.client.connect().then(() => {
        this.db = this.client.db();
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      });
    } catch (error) {
      console.log(error);
    }
  }

  isAlive() {
    return this.client.isConnected();
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
