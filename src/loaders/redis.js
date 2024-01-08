const config = require("../config");
const { createClient } = require("redis");
let redisClient;

(() => {
  redisClient = createClient({
    url: `redis://${config.REDIS_URL}:${config.REDIS_PORT}`,
    username: config.REDIS_USERNAME,
    password: config.REDIS_PASSWORD,
    database: config.REDIS_DB_NUMBER,
  });

  redisClient.on("connect", () => {
    console.log("Connected to redis server...");
  });

  redisClient.on("error", (error) => {
    console.log("Error connecting to redis server: " + error);
  });
})();

module.exports = redisClient;
