const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let db = undefined;

const start = async () => {
  db = await MongoMemoryServer.create();
  const URI = db.getUri();
  db.stop;
  await mongoose.connect(URI);
};

const stop = async () => {
  await db.stop();
};

const cleanup = async () => {
  mongoose.connection.dropDatabase();
};

module.exports = {
  start,
  stop,
  cleanup,
};
