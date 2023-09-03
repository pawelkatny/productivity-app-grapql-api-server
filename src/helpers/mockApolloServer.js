const { ApolloServer } = require("@apollo/server");
const schema = require("../src/loaders/schema");

const create = (context) => {
  const server = new ApolloServer({ schema });

  return server;
};

module.exports = {
  create,
};
