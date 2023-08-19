const config = require("../config");
const schema = require("./schema");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const httpServer = http.createServer(app);

const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "world",
  },
};

const server = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

module.exports = {
  start: async () => {
    await server.start();
    app.use(
      `/${config.API_PATH}`,
      cors(),
      bodyParser.json(),
      expressMiddleware(server, {
        context: async ({ req }) => ({ data: "CONTEXT" }),
      })
    );

    await new Promise((resolve) =>
      httpServer.listen({ port: config.PORT }, resolve)
    );

    console.log(
      `🚀 Server ready at http://localhost:${config.PORT}/${config.API_PATH}`
    );
  },
};
