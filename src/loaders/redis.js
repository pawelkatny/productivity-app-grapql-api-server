const config = require("../config");
const { createClient } = require("redis");

const redisClient = createClient({
  url: `redis://${config.REDIS_URL}:${config.REDIS_PORT}`,
});

redisClient.on("connect", () => {
  console.log("Connected to redis server...");
});

redisClient.on("error", (error) => {
  console.log("Error connecting to redis server: " + error);
});

module.exports = redisClient;
