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
  JWT_SECRECT: process.env.JWT_SECRECT,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION,
};
