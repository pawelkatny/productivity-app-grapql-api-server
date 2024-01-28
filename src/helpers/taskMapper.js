const { taskPriority } = require("../helpers");

const prepareTaskTypeObject = (task) => {
  return {
    ...task._doc,
    id: task._id.toString(),
    date:
      task._doc.type === "year"
        ? task._doc.date.getFullYear()
        : task._doc.date.toISOString(),
    createdAt: task._doc.createdAt.toISOString(),
    updatedAt: task._doc.updatedAt.toISOString(),
    priority: task.priority,
  };
};

module.exports = prepareTaskTypeObject;
