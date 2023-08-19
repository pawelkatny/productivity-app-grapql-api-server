const path = require("path");
const { GraphQLFileLoader } = require("@graphql-tools/graphql-file-loader");
const { loadSchemaSync } = require("@graphql-tools/load");
const resolvers = require("./resolvers");

const typeDefs = loadSchemaSync(path.resolve(__dirname, "types.graphql"), {
  loaders: [new GraphQLFileLoader()],
});
