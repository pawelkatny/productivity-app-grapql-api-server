const { JWT_EXPIRATION, JWT_TYPE } = require("../../config");
const { parseStatusCode } = require("../../helpers");
const { StatusCodes } = require("http-status-codes");
const { GraphQLError } = require("graphql");

module.exports = {
  Query: {
    user: async (parent, args, context, info) => {
      return "user query";
    },
  },
  Mutation: {
    registerUser: async (parent, { input }, { db: { User } }, info) => {
      let user = await User.findOne({ email: input.email });

      if (user) {
        throw new GraphQLError("Email address already in use.", {
          extensions: {
            code: parseStatusCode(StatusCodes.CONFLICT),
            http: {
              status: StatusCodes.CONFLICT,
            },
          },
        });
      }

      user = await User.create({ ...input });
      const accessToken = await user.createAuthToken();

      return {
        name: user.name,
        token: {
          accessToken,
          expiresIn: JWT_EXPIRATION,
          type: JWT_TYPE,
        },
      };
    },
  },
};
