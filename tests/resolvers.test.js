const apolloServer = require("../src/helpers/mockApolloServer");
const dbServer = require("../src/helpers/mockDbServer");
const context = require("../src/context");
const { ApolloServerErrorCode } = require("@apollo/server/errors");

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

describe("User resolver", () => {
  describe("registerUser", () => {
    it("should register user and return auth token data", async () => {
      const contextValue = {
        db: context.db,
      };

      const mockUserInputData = {
        email: "test@email.com",
        name: "Johny",
        password: "paS$w0rd",
      };

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
      const contextValue = {
        db: context.db,
      };

      const mockUserInputIncorrectData = {
        email: "testAnother@email.com",
        name: "Johny",
        password: "password",
      };

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

      expect(res.body.singleResult.data).toBeNull();
      expect(res.body.singleResult.errors).toBeDefined();
      expect(res.body.singleResult.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            errorsPretty: [
              {
                message:
                  "Password should contain at least: one uppercase character, one lowercase character, one digit and one special character (@$!%*?&).",
                path: "password",
              },
            ],
          }),
        ])
      );
      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        ApolloServerErrorCode.BAD_REQUEST
      );
    });
  });
});
