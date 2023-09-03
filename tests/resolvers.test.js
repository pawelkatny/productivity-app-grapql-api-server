const apolloServer = require("../src/helpers/mockApolloServer");
const dbServer = require("../src/helpers/mockDbServer");
const context = require("../src/context");

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
  it("should register user and return auth token data", async () => {
    const contextValue = {
      db: context.db,
    };

    const mockInputData = {
      email: "test@email.com",
      name: "Johny",
      password: "password",
    };
    const res = await server.executeOperation(
      {
        query:
          "mutation Mutation($input: RegisterUserInput!) {registerUser(input: $input) {name}}",
        variables: {
          input: mockInputData,
        },
      },
      {
        contextValue,
      }
    );

    expect(res.body.singleResult.errors).toBeUndefined();
    expect(res.body.singleResult.data).toBeDefined();
    expect(res.body.singleResult.data.registerUser).toEqual({
      name: mockInputData.name,
    });
  });
});
