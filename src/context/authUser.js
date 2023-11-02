const { JWT_SECRET } = require("../config");
const { jwt } = require("../helpers");
const User = require("../components/user/model");
const CustomGraphQLerror = require("../../error/customError");

const authUser = async (req) => {
  const authorization = req.headers.authorization;
  const isUserLogingOrRegistering = ["loginUserr", "registerUser"].some((q) =>
    req.body.query.includes(q)
  );

  //skip the authorization process if user is loging in or registering
  if (isUserLogingOrRegistering) null;

  if (!authorization || !authorization.startsWith("Bearer")) {
    return null;
  }

  const token = authorization.split(" ")[1];
  const decoded = await jwt.verify(token, JWT_SECRET);

  if (!decoded) {
    return null;
  }

  const { userId } = decoded;
  const user = await User.findOne({ _id: userId });

  if (!user) {
    return null;
  }

  const { settings } = user;

  return {
    userId,
    settings,
  };
};

module.exports = authUser;
