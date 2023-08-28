const config = require("../config");
const schema = require("./schema");
const context = require("../context");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { ApolloServerErrorCode } = require("@apollo/server/errors");
const { StatusCodes } = require("http-status-codes");
const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (formattedError, error) => {
    if (
      formattedError.extensions.code ===
      ApolloServerErrorCode.INTERNAL_SERVER_ERROR
    ) {
      error.extensions.http = {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }

    return { ...formattedError, http: { ...error.extensions.http } };
  },
});

module.exports = {
  start: async () => {
    await server.start();
    app.use(
      `/${config.API_PATH}`,
      cors(),
      bodyParser.json(),
      expressMiddleware(server, {
        context: async ({ req }) => ({ db: context.db }),
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
