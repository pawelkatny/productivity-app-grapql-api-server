const { StatusCodes } = require("http-status-codes");
const CustomGraphQLerror = require("../../error/customError");
const Task = require("../task/model");

module.exports = {
  Query: {
    getUser: async (parent, args, { authUser, db: { User } }, info) => {
      if (!authUser) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      const user = await User.findById(authUser.userId);

      if (!user) {
        throw new CustomGraphQLerror(StatusCodes.NOT_FOUND);
      }

      return {
        name: user.name,
        settings: user.settings,
        lastLoginDate: user.lastLoginDate.toISOString(),
      };
    },
  },
  Mutation: {
    registerUser: async (parent, { input }, { db: { User } }, info) => {
      let user = await User.findOne({ email: input.email });

      if (user) {
        throw new CustomGraphQLerror(StatusCodes.CONFLICT);
      }

      user = await User.create({ ...input });
      await user.updateLastLoginDate();
      await user.save();
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
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      const isPwdCorrect = await user.comparePwd(password);

      if (!isPwdCorrect) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      await user.updateLastLoginDate();
      await user.save();
      const token = await user.createAuthToken();

      return token;
    },
    deleteUser: async (parent, { input }, { authUser, db: { User } }, info) => {
      if (!authUser) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      const user = await User.findById(authUser.userId);

      if (!user) {
        throw new CustomGraphQLerror(StatusCodes.NOT_FOUND);
      }

      const isPwdCorrect = await user.comparePwd(input.password);

      if (!isPwdCorrect) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
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
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      const user = await User.findById(authUser.userId);

      if (!user) {
        throw new CustomGraphQLerror(StatusCodes.NOT_FOUND);
      }

      const isOldPwdCorrect = await user.comparePwd(input.oldPassword);

      if (!isOldPwdCorrect) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      user.password = input.newPassword;
      const updatedUser = await user.save();

      if (!updatedUser) {
        throw new CustomGraphQLerror(StatusCodes.INTERNAL_SERVER_ERROR);
      }

      return true;
    },
    updateUser: async (
      parent,
      { input: { name, settings } },
      { authUser, db: { User } },
      info
    ) => {
      if (!authUser) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      const user = await User.findById(authUser.userId);

      if (!user) {
        throw new CustomGraphQLerror(StatusCodes.NOT_FOUND);
      }

      user.name = name;
      user.settings = settings;
      const updatedUser = await user.save();

      return {
        name: updatedUser.name,
        settings: updatedUser.settings,
        lastLoginDate: updatedUser.lastLoginDate,
      };
    },
  },
};
