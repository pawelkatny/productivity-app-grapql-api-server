const { StatusCodes } = require("http-status-codes");
const CustomGraphQLerror = require("../../error/customError");
const Task = require("../task/model");
const { prepareUserOnLoginObject } = require("../../helpers");
const { REDIS_TKN_BLIST_SET } = require("../../config");
const { redisClient } = require("../../loaders");

module.exports = {
  Query: {
    getUser: async (parent, args, { auth: { user }, db: { User } }, info) => {
      const { name, settings, lastLoginDate } = user;

      return {
        name,
        settings,
        lastLoginDate: lastLoginDate.toISOString(),
      };
    },
    logoutUser: async (parent, args, { auth: { token } }, info) => {
      const res = await redisClient.sAdd(REDIS_TKN_BLIST_SET, token);
      console.log(res);
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
    deleteUser: async (
      parent,
      { input },
      { auth: { user }, db: { User } },
      info
    ) => {
      const isPwdCorrect = await user.comparePwd(input.password);

      if (!isPwdCorrect) {
        throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
      }

      await Task.deleteMany({ user: user._id });
      await User.findByIdAndDelete(user._id);
      const userExists = await User.exists({ _id: user._id });

      return userExists ? false : true;
    },
    changeUserPassword: async (
      parent,
      { input },
      { auth: { user }, db: { User } },
      info
    ) => {
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
      { auth: { user }, db: { User } },
      info
    ) => {
      user.name = name;
      user.settings = settings;
      const updatedUser = await user.save();

      return {
        name: updatedUser.name,
        settings: updatedUser.settings,
        lastLoginDate: updatedUser.lastLoginDate.toISOString(),
      };
    },
  },
};
