const apolloServer = require("../src/helpers/mockApolloServer");
const dbServer = require("../src/helpers/mockDbServer");
const context = require("../src/context");
const { ApolloServerErrorCode } = require("@apollo/server/errors");
const { jwt, parseStatusCode } = require("../src/helpers");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");

let server;

beforeAll(async () => {
  server = apolloServer.create();
  await dbServer.start();
});

afterAll(async () => {
  await dbServer.stop();
});

const mockUserInputData = {
  email: "test@email.com",
  name: "Johny",
  password: "paS$w0rd",
  lastLoginDate: new Date(),
};

const mockUserObjectData = {
  name: mockUserInputData.name,
  settings: {
    defaultView: "day",
    taskRequestLimit: 20,
  },
  lastLoginDate: mockUserInputData.lastLoginDate.toISOString(),
};

describe("User resolver queries", () => {
  describe("getUser", () => {
    it("should successfully return user data object", async () => {
      const { User } = context.db;
      const user = new User(mockUserInputData);
      const contextValue = {
        db: context.db,
        auth: {
          user: {
            name: user.name,
            settings: user.settings,
            lastLoginDate: new Date(),
          },
        },
      };

      const res = await server.executeOperation(
        {
          query: `query Query { getUser { name, settings { defaultView, taskRequestLimit } lastLoginDate }}`,
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.data.getUser).toBeDefined();
      expect(res.body.singleResult.data.getUser.lastLoginDate).toEqual(
        contextValue.auth.user.lastLoginDate.toISOString()
      );
      expect(res.body.singleResult.errors).toBeUndefined();
    });

    it("should throw error if user is not auth", async () => {
      const { User } = context.db;
      const user = new User(mockUserInputData);
      const contextValue = {
        db: context.db,
        authUser: false,
      };

      const res = await server.executeOperation(
        {
          query: `query Query { getUser { name, settings { defaultView, taskRequestLimit } lastLoginDate }}`,
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.data).toBeNull();
      expect(res.body.singleResult.errors).toBeDefined();
    });
  });
});
