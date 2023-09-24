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
        authUser: {
          isAuth: true,
          userId: user._id.toString(),
        },
      };

      jest.spyOn(User, "findById").mockImplementationOnce(() => user);

      const res = await server.executeOperation(
        {
          query: `query Query { getUser { name, settings { defaultView, taskRequestLimit } lastLoginDate }}`,
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.data.getUser).toEqual(mockUserObjectData);
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

    it("should throw error if user is not found", async () => {
      const { User } = context.db;
      const user = null;
      const contextValue = {
        db: context.db,
        authUser: true,
      };

      jest.spyOn(User, "findById").mockImplementationOnce(() => user);

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
      expect(res.body.singleResult.errors[0].message).toEqual(
        getReasonPhrase(StatusCodes.NOT_FOUND)
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.NOT_FOUND
      );
    });
  });
});
