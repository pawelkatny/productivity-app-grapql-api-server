const { StatusCodes } = require("http-status-codes");
const CustomGraphQLerror = require("../../error/customError");

const prepareTaskTypeObject = (task) => {
  return {
    ...task._doc,
    id: task._doc._id.toString(),
    date: task._doc.date.toISOString(),
    createdAt: task._doc.createdAt.toISOString(),
    updatedAt: task._doc.updatedAt.toISOString(),
  };
};

module.exports = {
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
    getTasks: async (
      parent,
      { params: { type, start, end, page } },
      { authUser, db: { Task, User } },
      info
    ) => {
      if (!authUser) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }
      const { userId, settings: userSettings } = authUser;
      let dateStart, endStart;

      dateStart = new Date(start);
      endStart = new Date(end);

      if (start == end) endStart = endStart.setDate(endStart.getDate() + 1);
      if (type == "year") {
        const year = dateStart.getYear();
        dateStart = new Date(year, 0).toDateString();
        endStart = new Date(+year + 1, 0).toDateString();
      }

      const searchParams = {
        user: userId,
        type,
        date: {
          $gte: dateStart,
          $lt: endStart,
        },
      };

      const tasksCount = await Task.countDocuments(searchParams);
      const tasks = await Task.find(searchParams)
        .skip(page)
        .limit(userSettings.taskRequestLimit)
        .sort({ priority: "asc" });
      const nextPage =
        page * userSettings.taskRequestLimit >= tasksCount ? 0 : page + 1;
      const tasksMapped = tasks.map((task) => prepareTaskTypeObject(task));

      return {
        tasks: tasksMapped,
        count: tasksCount,
        nextPage,
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

      return prepareTaskTypeObject(task);
    },
  },
};
