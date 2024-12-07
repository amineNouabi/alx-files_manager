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

    this.users = this.db.collection('users');
    this.files = this.db.collection('files');
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
