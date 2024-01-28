const { StatusCodes } = require("http-status-codes");
const CustomGraphQLerror = require("../../error/customError");
const { prepareTaskTypeObject } = require("../../helpers");

module.exports = {
  Tasks: {
    __resolveType(obj, contextValue, info) {
      if (obj.count) {
        return "TaskSingleListView";
      }

      if (!obj.count) {
        return "TaskAggregatedListView";
      }
      return null;
    },
  },
  Query: {
    getTask: async (
      parent,
      { id },
      {
        auth: {
          user: { _id: userId },
        },
        db: { Task },
      },
      info
    ) => {
      const task = await Task.findOne({ _id: id, user: userId });

      if (!task) {
        throw new CustomGraphQLerror(StatusCodes.NOT_FOUND);
      }

      return prepareTaskTypeObject(task);
    },
    getTasks: async (
      parent,
      { params },
      { auth: { user }, db: { Task } },
      info
    ) => {
      const { view } = params;
      let tasks;
      if (view == "day" || view == "year") {
        tasks = await Task.getSingleList(params, user);
      }

      if (view == "week" || view == "month") {
        tasks = await Task.getAggregatedList(params, user);
      }

      return tasks;
    },
  },
  Mutation: {
    createTask: async (
      parent,
      { input },
      {
        auth: {
          user: { _id: userId },
        },
        db: { Task },
      },
      info
    ) => {
      const task = await Task.create({ ...input, user: userId });

      if (!task) {
        throw new CustomGraphQLerror(StatusCodes.INTERNAL_SERVER_ERROR);
      }

      return prepareTaskTypeObject(task);
    },
    updateTask: async (
      parent,
      { input },
      {
        auth: {
          user: { _id: userId },
        },
        db: { Task },
      },
      info
    ) => {
      const { id, ...dataToUpdate } = input;
      const task = await Task.findOne({ _id: id, user: userId });

      if (!task) {
        throw new CustomGraphQLerror(StatusCodes.NOT_FOUND);
      }

      if (Object.keys(dataToUpdate).length === 0) {
        throw new CustomGraphQLerror(StatusCodes.BAD_REQUEST);
      }

      for (const key in dataToUpdate) {
        task[key] = dataToUpdate[key];
      }

      await task.save();
      return prepareTaskTypeObject(task);
    },
    deleteTask: async (
      parent,
      { id },
      {
        auth: {
          user: { _id: userId },
        },
        db: { Task },
      },
      info
    ) => {
      const task = await Task.findOne({ _id: id, user: userId });

      if (!task) {
        throw new CustomGraphQLerror(StatusCodes.NOT_FOUND);
      }

      await Task.findByIdAndDelete(id);
      const taskExists = await Task.exists({ _id: id });

      return !taskExists ? true : false;
    },
  },
};
