const { JWT_EXPIRATION, JWT_TYPE } = require("../../config");
const { parseStatusCode } = require("../../helpers");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { GraphQLError } = require("graphql");
const Task = require("../task/model");

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
      const token = await user.createAuthToken();

      return token;
    },
    loginUser: async (
      parent,
      { input: { email, password } },
      { db: { User } },
      info
    ) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new GraphQLError(getReasonPhrase(StatusCodes.UNAUTHORIZED), {
          extensions: {
            code: parseStatusCode(StatusCodes.UNAUTHORIZED),
            http: {
              status: StatusCodes.UNAUTHORIZED,
            },
          },
        });
      }

      const isPwdCorrect = await user.comparePwd(password);

      if (!isPwdCorrect) {
        throw new GraphQLError(getReasonPhrase(StatusCodes.UNAUTHORIZED), {
          extensions: {
            code: parseStatusCode(StatusCodes.UNAUTHORIZED),
            http: {
              status: StatusCodes.UNAUTHORIZED,
            },
          },
        });
      }

      const token = await user.createAuthToken();

      return token;
    },
    deleteUser: async (parent, { input }, { authUser, db: { User } }, info) => {
      if (!authUser) {
        throw new GraphQLError(getReasonPhrase(StatusCodes.UNAUTHORIZED), {
          extensions: {
            code: parseStatusCode(StatusCodes.UNAUTHORIZED),
            http: {
              status: StatusCodes.UNAUTHORIZED,
            },
          },
        });
      }

      const user = await User.findById(authUser.userId);

      if (!user) {
        throw new GraphQLError(getReasonPhrase(StatusCodes.NOT_FOUND), {
          extensions: {
            code: parseStatusCode(StatusCodes.NOT_FOUND),
            http: {
              status: StatusCodes.NOT_FOUND,
            },
          },
        });
      }

      const isPwdCorrect = await user.comparePwd(input.password);

      if (!isPwdCorrect) {
        throw new GraphQLError(getReasonPhrase(StatusCodes.UNAUTHORIZED), {
          extensions: {
            code: parseStatusCode(StatusCodes.UNAUTHORIZED),
            http: {
              status: StatusCodes.UNAUTHORIZED,
            },
          },
        });
      }

      await Task.deleteMany({ user: authUser.userId });
      await User.findByIdAndDelete(authUser.userId);
      const userExists = await User.exists({ _id: authUser.userId });

      return !userExists ? true : false;
    },
    changeUserPassword: async (
      parent,
      { input },
      { authUser, db: { User } },
      info
    ) => {
      if (!authUser) {
        throw new GraphQLError(getReasonPhrase(StatusCodes.UNAUTHORIZED), {
          extensions: {
            code: parseStatusCode(StatusCodes.UNAUTHORIZED),
            http: {
              status: StatusCodes.UNAUTHORIZED,
            },
          },
        });
      }

      const user = await User.findById(authUser.userId);

      if (!user) {
        throw new GraphQLError(getReasonPhrase(StatusCodes.NOT_FOUND), {
          extensions: {
            code: parseStatusCode(StatusCodes.NOT_FOUND),
            http: {
              status: StatusCodes.NOT_FOUND,
            },
          },
        });
      }

      const isOldPwdCorrect = await user.comparePwd(input.oldPassword);

      if (!isOldPwdCorrect) {
        throw new GraphQLError(getReasonPhrase(StatusCodes.UNAUTHORIZED), {
          extensions: {
            code: parseStatusCode(StatusCodes.UNAUTHORIZED),
            http: {
              status: StatusCodes.UNAUTHORIZED,
            },
          },
        });
      }

      user.password = input.newPassword;
      const updatedUser = await user.save();

      if (!updatedUser) {
        throw new GraphQLError(
          getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
          {
            extensions: {
              code: parseStatusCode(StatusCodes.INTERNAL_SERVER_ERROR),
              http: {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
              },
            },
          }
        );
      }

      return true;
    },
  },
};
