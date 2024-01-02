const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, `../../.env.${process.env.NODE_ENV}`),
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "local",
  API_PATH: process.env.API_PATH,
  PORT: process.env.PORT,
  MONGO_URL: process.env.MONGO_DB_URL,
  BCRYPT_SALT: process.env.BCRYPT_SALT,
  JWT_SECRET: process.env.JWT_SECRECT,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION,
  JWT_TYPE: process.env.JWT_TYPE,
  REDIS_URL: process.env.REDIS_URL || "localhost",
  REDIS_URL: process.env.REDIS_PORT || 6379,
  REDIS_TKN_BLIST_SET: process.env.REDIS_TKN_BLIST_SET || "token_blacklist",
};
