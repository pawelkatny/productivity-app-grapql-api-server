const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const {
  ApolloServerErrorCode,
  unwrapResolverError,
} = require("@apollo/server/errors");
const { ValidationError } = require("mongoose").Error;
const { StatusCodes } = require("http-status-codes");
const schema = require("../src/loaders/schema");
const context = require("../src/context");

const create = async (listenOpts = { port: 4000 }) => {
  const server = new ApolloServer({
    schema,
    formatError: (formattedError, error) => {
      const originalError = unwrapResolverError(error);
      const { message, extensions } = error;
      let errorsPretty = [];

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
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => ({
      authUser: await context.authUser(req),
      db: context.db,
    }),
    listen: listenOpts,
  });

  return { server, url };
};

module.exports = {
  create,
};
