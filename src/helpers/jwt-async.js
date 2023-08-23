const jwt = require("jsonwebtoken");

const sign = (data, secret, options = null) => {
  return new Promise((resolve, reject) => {
    jwt.sign(data, secret, null, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
};

const verify = (data, secret, options = null) => {
  return new Promise((resolve, reject) => {
    jwt.verify(data, secret, options, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = {
  sign,
  verify,
};
