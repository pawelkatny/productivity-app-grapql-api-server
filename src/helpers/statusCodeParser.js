const { getReasonPhrase } = require("http-status-codes");

const parseStatusCode = (code) => {
  return getReasonPhrase(code)
    .replace(/[+*?^$()[]{}'|\`]/, "")
    .replace("/s/", "_")
    .toUpperCase();
};

module.exports = parseStatusCode;
