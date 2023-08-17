const config = require("../config");
const mongoose = require("mongoose");

module.exports = {
  connect: async () => {
    return await mongoose.connect(config.MONGO_URL);
  },
};
