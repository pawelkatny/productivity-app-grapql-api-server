const { db, express } = require("./loaders");

(async () => {
  try {
    await db.connect();
    await express.start();
  } catch (error) {
    console.log("Failed to start the server: ", error);
  }
})();
