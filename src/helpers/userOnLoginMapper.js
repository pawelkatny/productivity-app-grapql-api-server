const prepareUserOnLoginObject = (user, token) => {
  const { name, settings, lastLoginDate } = user;

  return {
    user: {
      name,
      settings,
      lastLoginDate,
    },
    auth: token,
  };
};

module.exports = prepareUserOnLoginObject;
