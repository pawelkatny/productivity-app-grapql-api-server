const { StatusCodes } = require("http-status-codes");
const CustomGraphQLerror = require("../../error/customError");

module.exports = {
  Query: {
    task: async (parent, args, context, info) => {
      return "task query";
    },
  },
  Mutation: {
    createTask: async (parent, { input }, { authUser, db: { Task } }, info) => {
      if (!authUser) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      const task = await Task.create({ ...input, user: authUser.userId });

      if (!task) {
        throw new CustomGraphQLerror(StatusCodes.INTERNAL_SERVER_ERROR);
      }

      return {
        ...task._doc,
        id: task._doc._id.toString(),
        date: task._doc.date.toISOString(),
      };
    },
  },
};
