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
    .skip(page - 1)
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
};

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
