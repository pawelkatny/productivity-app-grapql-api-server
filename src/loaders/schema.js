const { makeExecutableSchema } = require("@graphql-tools/schema");
const {
  typeDefs: taskTypeDefs,
  resolvers: taskResolvers,
} = require("../components/task");

module.exports = makeExecutableSchema({
  typeDefs: [taskTypeDefs],
  resolvers: [taskResolvers],
});
