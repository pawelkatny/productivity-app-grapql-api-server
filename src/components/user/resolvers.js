const { StatusCodes } = require("http-status-codes");
const CustomGraphQLerror = require("../../error/customError");
const Task = require("../task/model");
const { prepareUserOnLoginObject } = require("../../helpers");
module.exports = {
  Query: {
    getUser: async (parent, args, { authUser, db: { User } }, info) => {
      const { name, settings, lastLoginDate } = authUser;

      return {
        name,
        settings,
        lastLoginDate: lastLoginDate.toISOString(),
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

      return prepareUserOnLoginObject(user, token);
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

      return prepareUserOnLoginObject(user, token);
    },
    deleteUser: async (parent, { input }, { authUser, db: { User } }, info) => {
      const isPwdCorrect = await authUser.comparePwd(input.password);

      if (!isPwdCorrect) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      await Task.deleteMany({ user: authUser._id });
      await User.findByIdAndDelete(authUser._id);
      const userExists = await User.exists({ _id: authUser._id });

      return userExists;
    },
    changeUserPassword: async (
      parent,
      { input },
      { authUser, db: { User } },
      info
    ) => {
      const isOldPwdCorrect = await authUser.comparePwd(input.oldPassword);

      if (!isOldPwdCorrect) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      authUser.password = input.newPassword;
      const updatedUser = await authUser.save();

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
      authUser.name = name;
      authUser.settings = settings;
      const updatedUser = await authUser.save();

      return {
        name: updatedUser.name,
        settings: updatedUser.settings,
        lastLoginDate: updatedUser.lastLoginDate.toISOString(),
      };
    },
  },
};
