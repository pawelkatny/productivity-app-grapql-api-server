const { GraphQLError } = require("graphql");
const { getReasonPhrase } = require("http-status-codes");
const { parseStatusCode } = require("../../helpers");

module.exports = class CustomGraphQLerror extends GraphQLError {
  constructor(statusCode) {
    const message = getReasonPhrase(statusCode);
    const extensions = {
      code: parseStatusCode(statusCode),
      http: {
        status: statusCode,
      },
    };

    super(message, { extensions });
  }
};
