const { StatusCodes } = require("http-status-codes");
const CustomGraphQLerror = require("../../error/customError");
const { prepareTaskTypeObject } = require("../../helpers");

module.exports = {
  Tasks: {
    __resolveType(obj, contextValue, info) {
      if (obj.count) {
        return "TaskSingleView";
      }

      if (!obj.count) {
        return "TaskWeekView";
      }
      return null;
    },
  },
  Query: {
    getTask: async (parent, { id }, { authUser, db: { Task } }, info) => {
      if (!authUser) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }
      const task = await Task.findOne({ _id: id, user: authUser.userId });

      if (!task) {
        throw new CustomGraphQLerror(StatusCodes.NOT_FOUND);
      }

      return prepareTaskTypeObject(task);
    },
    getTasks: async (parent, { params }, { authUser, db: { Task } }, info) => {
      if (!authUser) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }
      const { view } = params;
      let tasks;

      if (view == "day" || view == "year") {
        tasks = await Task.getSingleList(params, authUser);
      }

      if (view == "week" || view == "month") {
        tasks = await Task.getAggregatedList(params, authUser);
      }

      return tasks;
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

      return prepareTaskTypeObject(task);
    },
  },
};
