const { JWT_SECRET, JWT_EXPIRATION } = require("../config");
const { jwt } = require("../helpers");
const { db: User } = require("./index");

const authUser = async (req) => {
  const authorization = req.headers.authorization;

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

  return {
    isAuth: true,
    userId,
  };
};

module.exports = authUser;
