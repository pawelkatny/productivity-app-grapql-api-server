const { db, express, redisClient } = require("./loaders");

(async () => {
  try {
    await db.connect();
    await redisClient.connect();
    await express.start();
  } catch (error) {
    console.log("Failed to start the server: ", error);
  }
})();
