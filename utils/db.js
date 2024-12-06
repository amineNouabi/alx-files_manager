import { MongoClient } from 'mongodb';

export default class DBClient {
  constructor() {
    this.db = MongoClient.connect(process.env.DB_HOST || 'mongodb://localhost:27017', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((client) => client.db(process.env.DB_DATABASE || 'files_manager'));
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
