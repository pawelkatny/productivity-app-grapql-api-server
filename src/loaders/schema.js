const { makeExecutableSchema } = require("@graphql-tools/schema");
const {
  typeDefs: taskTypeDefs,
  resolvers: taskResolvers,
} = require("../components/task");
const {
  typeDefs: userTypeDefs,
  resolvers: userResolvers,
} = require("../components/user");

module.exports = makeExecutableSchema({
  typeDefs: [taskTypeDefs, userTypeDefs],
  resolvers: [taskResolvers, userResolvers],
});
