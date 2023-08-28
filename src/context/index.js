const { User } = require("../components/user");
const { Task } = require("../components/task");
const authUser = require("./authUser");

module.exports = {
  authUser,
  db: {
    User,
    Task,
  },
};
