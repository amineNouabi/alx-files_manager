import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}`;

export class DBClient {
  constructor() {
    MongoClient.connect(DB_URL, {
      useUnifiedTopology: true,
    }, (err, client) => {
      if (err) {
        this.db = false;
        console.log(err);
        return;
      }
      this.db = client.db(DB_DATABASE);
    });
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
