const { JWT_SECRET } = require("../config");
const { jwt } = require("../helpers");
const User = require("../components/user/model");
const { StatusCodes } = require("http-status-codes");
const CustomGraphQLerror = require("../error/customError");
const redisClient = require("../loaders/redis");

const authUser = async (req) => {
  const INTROSPECTION_QUERY = "IntrospectionQuery";
  const NON_AUTH_QUERIES = ["loginUser", "registerUser"];
  const authorization = req.headers.authorization;
  const isIntrospectionQuery = req.body.query.includes(INTROSPECTION_QUERY);
  const isUserLogingOrRegistering = NON_AUTH_QUERIES.some((q) =>
    req.body.query.includes(q)
  );

  if (isIntrospectionQuery) {
    return null;
  }

  if (
    (!authorization || !authorization.startsWith("Bearer")) &&
    isUserLogingOrRegistering
  ) {
    return null;
  }

  if (
    (!authorization || !authorization.startsWith("Bearer")) &&
    !isUserLogingOrRegistering
  ) {
    throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
  }

  const token = authorization.split(" ")[1];
  const decoded = await jwt.verify(token, JWT_SECRET);

  if (!decoded && !isUserLogingOrRegistering) {
    throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
  }

  if (!decoded && isUserLogingOrRegistering) {
    return null;
  }

  const { userId } = decoded;
  //check if token was blacklisted
  const userIdValue = await redisClient.get(token);
  if (userIdValue === userId) {
    throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
  }

  const user = await User.findOne({ _id: userId });

  if (!user && isUserLogingOrRegistering) {
    return null;
  }

  if (!user) {
    throw new CustomGraphQLerror(StatusCodes.UNAUTHORIZED);
  }

  return {
    decoded,
    token,
    user,
  };
};

module.exports = authUser;
