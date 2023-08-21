const config = require("../config");
const mongoose = require("mongoose");

module.exports = {
  connect: () => {
    return mongoose.connect(config.MONGO_URL);
  },
};
