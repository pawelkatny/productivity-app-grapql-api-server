const { StatusCodes } = require("http-status-codes");
const CustomGraphQLerror = require("../../error/customError");

module.exports = {
  Query: {
    getTask: async (
      parent,
      { input: taskId },
      { authUser, db: { Task } },
      info
    ) => {
      if (!authUser) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      const task = await Task.findById(taskId);

      if (!task) {
        throw new CustomGraphQLerror(StatusCodes.NOT_FOUND);
      }

      return {
        ...task._doc,
        id: task._doc._id.toString(),
        date: task._doc.date.toISOString(),
        createdAt: task._doc.createdAt.toISOString(),
        updatedAt: task._doc.updatedAt.toISOString(),
      };
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
        createdAt: task._doc.createdAt.toISOString(),
        updatedAt: task._doc.updatedAt.toISOString(),
      };
    },
  },
};
