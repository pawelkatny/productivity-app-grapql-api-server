const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, `../../.env.${process.env.NODE_ENV}`),
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "local",
  PORT: process.env.PORT,
  MONGO_URL: process.env.MONGO_DB_URL,
};
