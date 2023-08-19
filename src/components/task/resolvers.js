const resolvers = {
  Query: {
    task: async (parent, args, context, info) => {
      return "task query";
    },
  },
};
