const mongoose = require("mongoose");
const { prepareTaskTypeObject } = require("../../helpers");

const taskSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Task name is required."],
      minlength: 5,
      maxlength: 50,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["day", "year"],
      default: "day",
    },

    date: {
      type: Date,
      required: true,
      default: new Date(),
    },

    isCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },

    completionDate: {
      type: Date,
    },

    notes: {
      type: String,
      maxlength: 500,
    },

    priority: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.statics.getSingleList = async (params, authUser) => {
  const { type, start, end, page } = params;
  const { userId, settings: userSettings } = authUser;
  let dateStart, endStart, date;

  dateStart = new Date(start);
  endStart = new Date(end);

  if (type == "day") {
    date = dateStart.toISOString().split("T")[0];
    endStart = new Date(start);
    endStart = new Date(endStart.setDate(endStart.getDate() + 1));
  }
  if (type == "year") {
    date = dateStart.toISOString().split("-")[0];
    const year = dateStart.getFullYear();
    dateStart = new Date(year, 0);
    endStart = new Date(+year + 1, 0);
  }

  const searchParams = {
    user: userId,
    type,
    date: {
      $gte: dateStart.toDateString(),
      $lt: endStart.toDateString(),
    },
  };

  const tasksCount = await Task.countDocuments(searchParams);
  const tasks = await Task.find(searchParams)
    .skip(page - 1)
    .limit(userSettings.taskRequestLimit)
    .sort({ priority: "asc" });
  const nextPage =
    page * userSettings.taskRequestLimit >= tasksCount ? 0 : page + 1;
  const tasksMapped = tasks.map((task) => prepareTaskTypeObject(task));

  return {
    date,
    tasks: tasksMapped,
    count: tasksCount,
    page,
    nextPage,
  };
};

taskSchema.statics.getArrayList = async (params, authUser) => {
  const { type, start, end, page } = params;
  const { userId, settings: userSettings } = authUser;
  let dateStart, endStart, date;

  dateStart = new Date(start);
  endStart = new Date(end);

  const searchParams = {
    user: new mongoose.Types.ObjectId(userId),
    type: "day",
    date: {
      $gte: dateStart,
      $lt: endStart,
    },
  };

  const tasks = await Task.aggregate([
    {
      $match: searchParams,
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" },
        },
        tasks: { $push: "$$ROOT" },
        count: { $sum: 1 },
      },
    },
    {
      $addFields: {
        tasks: {
          $map: {
            input: "$tasks",
            as: "task",
            in: {
              $mergeObjects: [
                "$$task",
                {
                  id: {
                    $toString: "$$task._id",
                  },
                  date: {
                    $toString: "$$task.date",
                  },
                  createdAt: {
                    $toString: "$$task.createdAt",
                  },
                  updatedAt: {
                    $toString: "$$task.updatedAt",
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        tasks: { $slice: ["$tasks", 2, userSettings.taskRequestLimit] },
        count: "$count",
        page: 1,
        nextPage: {
          $cond: {
            if: { $gte: ["$count", userSettings.taskRequestLimit] },
            then: 2,
            else: 0,
          },
        },
      },
    },
  ]);

  return { tasks };
};

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
