const { ApolloServer } = require("@apollo/server");
const schema = require("../loaders/schema");

const create = () => {
  const server = new ApolloServer({ schema });

  return server;
};

module.exports = {
  create,
};
