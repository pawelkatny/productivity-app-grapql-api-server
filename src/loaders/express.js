const config = require("../config");
const schema = require("./schema");
const context = require("../context");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const {
  ApolloServerErrorCode,
  unwrapResolverError,
} = require("@apollo/server/errors");
const { ValidationError } = require("mongoose").Error;
const { StatusCodes } = require("http-status-codes");
const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
// const redisClient = require("./redis");

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (formattedError, error) => {
    let { message, extensions } = formattedError;
    const originalError = unwrapResolverError(error);
    let errorsPretty = [];

    if (originalError.extensions?.http) {
      extensions.http = { ...originalError.extensions.http };
    }

    if (extensions.code === ApolloServerErrorCode.INTERNAL_SERVER_ERROR) {
      extensions.http = {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }

    if (originalError instanceof ValidationError) {
      for (const err in originalError.errors) {
        errorsPretty.push({
          message: originalError.errors[err].message,
          path: originalError.errors[err].path,
        });
      }
      extensions.code = ApolloServerErrorCode.BAD_REQUEST;
      extensions.http = {
        status: StatusCodes.BAD_REQUEST,
      };
    }

    return { message, errorsPretty, extensions };
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
        context: async ({ req }) => ({
          auth: await context.authUser(req),
          db: context.db,
          // redisClient,
        }),
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
