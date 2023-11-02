const { JWT_SECRET } = require("../config");
const { jwt } = require("../helpers");
const User = require("../components/user/model");
const { StatusCodes } = require("http-status-codes");
const CustomGraphQLerror = require("../error/customError");

const authUser = async (req) => {
  const authorization = req.headers.authorization;
  const isUserLogingOrRegistering = ["loginUserr", "registerUser"].some((q) =>
    req.body.query.includes(q)
  );

  //skip the authorization process if user is loging in or registering
  if (isUserLogingOrRegistering) null;

  if (!authorization || !authorization.startsWith("Bearer")) {
    throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
  }

  const token = authorization.split(" ")[1];
  const decoded = await jwt.verify(token, JWT_SECRET);

  if (!decoded) {
    throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
  }

  const { userId } = decoded;
  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
  }

  const { settings } = user;

  return {
    userId,
    settings,
  };
};

module.exports = authUser;
