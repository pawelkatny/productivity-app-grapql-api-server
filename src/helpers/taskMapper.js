const prepareTaskTypeObject = (task) => {
  return {
    ...task._doc,
    id: task._doc._id.toString(),
    date: task._doc.date.toISOString(),
    createdAt: task._doc.createdAt.toISOString(),
    updatedAt: task._doc.updatedAt.toISOString(),
  };
};

module.exports = prepareTaskTypeObject;
