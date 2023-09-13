const apolloServer = require("../src/helpers/mockApolloServer");
const dbServer = require("../src/helpers/mockDbServer");
const context = require("../src/context");
const { ApolloServerErrorCode } = require("@apollo/server/errors");
const { jwt } = require("../src/helpers");
const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");

let server;

jest.mock("../src/config", () => ({
  BCRYPT_SALT: 10,
  JWT_SECRET: "secret",
  JWT_EXPIRATION: "1h",
}));

beforeAll(async () => {
  server = apolloServer.create();
  await dbServer.start();
});

afterAll(async () => {
  await dbServer.stop();
});

const contextValue = {
  db: context.db,
};

const mockUserInputData = {
  email: "test@email.com",
  name: "Johny",
  password: "paS$w0rd",
};

const mockUserInputIncorrectData = {
  email: "testAnother@email.com",
  name: "Johny",
  password: "password",
};

describe("User resolver", () => {
  describe("registerUser", () => {
    it("should register user and return auth token data", async () => {
      const res = await server.executeOperation(
        {
          query:
            "mutation Mutation($input: RegisterUserInput!) {registerUser(input: $input) {name}}",
          variables: {
            input: mockUserInputData,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors).toBeUndefined();
      expect(res.body.singleResult.data).toBeDefined();
      expect(res.body.singleResult.data.registerUser).toEqual({
        name: mockUserInputData.name,
      });
    });

    it("should throw validation error on password not matching requirements", async () => {
      const res = await server.executeOperation(
        {
          query:
            "mutation Mutation($input: RegisterUserInput!) {registerUser(input: $input) {name}}",
          variables: {
            input: mockUserInputIncorrectData,
          },
        },
        {
          contextValue,
        }
      );

      const expectErrObj = expect.objectContaining({
        errorsPretty: [
          {
            message:
              "Password should contain at least: one uppercase character, one lowercase character, one digit and one special character (@$!%*?&).",
            path: "password",
          },
        ],
      });

      const expectErrArr = expect.arrayContaining([expectErrObj]);

      expect(res.body.singleResult.data).toBeNull();
      expect(res.body.singleResult.errors).toBeDefined();
      expect(res.body.singleResult.errors).toEqual(expectErrArr);
      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        ApolloServerErrorCode.BAD_REQUEST
      );
    });
  });

  describe("loginUser", () => {
    it("should login in and return token object", async () => {
      jest.spyOn(jwt, "sign").mockResolvedValueOnce("accessToken");

      const loginUserInput = {
        email: mockUserInputData.email,
        password: mockUserInputData.password,
      };
      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: LoginUserInput!) {loginUser(input: $input) { token { accessToken }}}`,
          variables: {
            input: loginUserInput,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors).toBeFalsy();
      expect(res.body.singleResult.data.loginUser.token.accessToken).toEqual(
        "accessToken"
      );
    });

    it("should throw error when email not found", async () => {
      const loginUserInput = {
        email: mockUserInputIncorrectData.email,
        password: mockUserInputIncorrectData.password,
      };
      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: LoginUserInput!) {loginUser(input: $input) { name }}`,
          variables: {
            input: loginUserInput,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.data).toBeNull();
      expect(res.body.singleResult.errors).toBeDefined();
      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        "UNAUTHORIZED"
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.UNAUTHORIZED
      );
    });

    it("should throw error when passwords dont match", async () => {
      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(false);

      const loginUserInput = {
        email: mockUserInputData.email,
        password: mockUserInputData.password,
      };
      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: LoginUserInput!) {loginUser(input: $input) { name }}`,
          variables: {
            input: loginUserInput,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.data).toBeNull();
      expect(res.body.singleResult.errors).toBeDefined();
      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        "UNAUTHORIZED"
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.UNAUTHORIZED
      );
    });
  });
});
