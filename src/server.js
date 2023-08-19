const { db, express } = require("./loaders");
const task = require("./components/task/index");

(async () => {
  try {
    await db.connect();
    await express.start();
  } catch (error) {
    console.log("Failed to start the server: ", error);
  }
})();
