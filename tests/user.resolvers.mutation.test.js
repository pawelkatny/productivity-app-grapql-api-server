const apolloServer = require("../src/helpers/mockApolloServer");
const dbServer = require("../src/helpers/mockDbServer");
const context = require("../src/context");
const { ApolloServerErrorCode } = require("@apollo/server/errors");
const { jwt } = require("../src/helpers");
const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

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

const mockUserUpdateData = {
  name: "John",
  settings: {
    defaultView: "year",
    taskRequestLimit: 100,
  },
};

describe("User resolver", () => {
  describe("registerUser", () => {
    it("should register user and return auth token data", async () => {
      jest.spyOn(jwt, "sign").mockResolvedValueOnce("accessToken");
      const res = await server.executeOperation(
        {
          query:
            "mutation Mutation($input: RegisterUserInput!) {registerUser(input: $input) { auth { token { accessToken }}}}",
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
      expect(res.body.singleResult.data.registerUser.auth).toEqual({
        token: {
          accessToken: "accessToken",
        },
      });
    });

    it("should throw validation error on password not matching requirements", async () => {
      const res = await server.executeOperation(
        {
          query:
            "mutation Mutation($input: RegisterUserInput!) {registerUser(input: $input) {auth { token { accessToken }}}}",
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
          query: `mutation Mutation($input: LoginUserInput!) {loginUser(input: $input) { auth { token { accessToken }}}}`,
          variables: {
            input: loginUserInput,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors).toBeFalsy();
      expect(
        res.body.singleResult.data.loginUser.auth.token.accessToken
      ).toEqual("accessToken");
    });

    it("should throw error when email not found", async () => {
      const loginUserInput = {
        email: mockUserInputIncorrectData.email,
        password: mockUserInputIncorrectData.password,
      };
      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: LoginUserInput!) {loginUser(input: $input) { auth { token { accessToken }}}}`,
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
          query: `mutation Mutation($input: LoginUserInput!) {loginUser(input: $input) { auth { token { accessToken }}}}`,
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

  describe("delteUser", () => {
    it("should successfully delete user and connected tasks", async () => {
      const { User, Task } = context.db;
      const user = new User();
      const password = "password";
      const authUser = {
        userId: user._id.toString(),
      };

      const contextValue = {
        db: context.db,
        authUser,
      };

      const userFindById = jest
        .spyOn(User, "findById")
        .mockImplementationOnce(() => user);
      const userFindByIdAndDelete = jest.spyOn(User, "findByIdAndDelete");
      const userExists = jest
        .spyOn(User, "exists")
        .mockResolvedValueOnce(false);
      const taskDeleteMany = jest.spyOn(Task, "deleteMany");
      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true);

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: DeleteUserInput!) {deleteUser(input: $input)}`,
          variables: {
            input: {
              password,
            },
          },
        },
        {
          contextValue,
        }
      );

      expect(userFindById).toBeCalledWith(authUser.userId);
      expect(taskDeleteMany).toBeCalledWith({ user: authUser.userId });
      expect(userFindByIdAndDelete).toBeCalledWith(authUser.userId);
      expect(res.body.singleResult.data.deleteUser).toEqual(true);
    });
    it("should return error when user not found", async () => {
      const { User, Task } = context.db;
      const user = new User();
      const password = "password";
      const authUser = {
        userId: user._id.toString(),
      };

      const contextValue = {
        db: context.db,
        authUser,
      };

      const userFindById = jest
        .spyOn(User, "findById")
        .mockImplementationOnce(() => null);

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: DeleteUserInput!) {deleteUser(input: $input)}`,
          variables: {
            input: {
              password,
            },
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        "NOT FOUND"
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.NOT_FOUND
      );
      expect(res.body.singleResult.data).toEqual(null);
    });
    it("should return error when password doesnt match", async () => {
      const { User, Task } = context.db;
      const user = new User();
      const password = "password";
      const authUser = {
        userId: user._id.toString(),
      };

      const contextValue = {
        db: context.db,
        authUser,
      };

      const userFindById = jest
        .spyOn(User, "findById")
        .mockImplementationOnce(() => user);

      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(false);

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: DeleteUserInput!) {deleteUser(input: $input)}`,
          variables: {
            input: {
              password,
            },
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        "UNAUTHORIZED"
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.UNAUTHORIZED
      );
      expect(res.body.singleResult.data).toEqual(null);
    });
  });
  describe("changeUserPassword", () => {
    it("should successfully change user password", async () => {
      const { User, Task } = context.db;
      const user = new User({
        ...mockUserInputData,
        email: mockUserInputData.email + "n",
      });
      const input = {
        oldPassword: mockUserInputData.password,
        newPassword: mockUserInputData.password + "!",
      };
      const authUser = {
        userId: user._id.toString(),
      };

      const contextValue = {
        db: context.db,
        authUser,
      };

      const userFindById = jest
        .spyOn(User, "findById")
        .mockImplementationOnce(() => user);

      jest.spyOn(user, "save").mockImplementationOnce(() => true);
      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true);
      jest.spyOn(bcrypt, "hash").mockResolvedValueOnce("hashedPassword");

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: ChangeUserPasswordInput!) {changeUserPassword(input: $input)}`,
          variables: {
            input,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.data.changeUserPassword).toEqual(true);
      expect(res.body.singleResult.errors).toBeFalsy();
    });
    it("should throw error if request is missing authUser object", async () => {
      const input = {
        oldPassword: mockUserInputData.password,
        newPassword: mockUserInputData.password + "!",
      };

      const contextValue = {
        db: context.db,
        authUser: null,
      };

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: ChangeUserPasswordInput!) {changeUserPassword(input: $input)}`,
          variables: {
            input,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        "UNAUTHORIZED"
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.UNAUTHORIZED
      );
      expect(res.body.singleResult.data).toEqual(null);
    });
    it("should throw error if user is not found", async () => {
      const { User, Task } = context.db;

      const input = {
        oldPassword: mockUserInputData.password,
        newPassword: mockUserInputData.password + "!",
      };

      const contextValue = {
        db: context.db,
        authUser: true,
      };

      jest.spyOn(User, "findById").mockImplementationOnce(() => null);

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: ChangeUserPasswordInput!) {changeUserPassword(input: $input)}`,
          variables: {
            input,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        "NOT FOUND"
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.NOT_FOUND
      );
      expect(res.body.singleResult.data).toEqual(null);
    });
    it("should throw error if user is not found", async () => {
      const { User, Task } = context.db;
      const user = new User();
      const input = {
        oldPassword: mockUserInputData.password,
        newPassword: mockUserInputData.password + "!",
      };

      const contextValue = {
        db: context.db,
        authUser: true,
      };

      jest.spyOn(User, "findById").mockImplementationOnce(() => user);

      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(false);

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: ChangeUserPasswordInput!) {changeUserPassword(input: $input)}`,
          variables: {
            input,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        "UNAUTHORIZED"
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.UNAUTHORIZED
      );
      expect(res.body.singleResult.data).toEqual(null);
    });
  });
  describe("updateUser", () => {
    it("should successfully update user document", async () => {
      const { User, Task } = context.db;
      const user = new User(mockUserInputData);

      const contextValue = {
        db: context.db,
        authUser: true,
      };

      const lastLoginDate = new Date();

      jest.spyOn(User, "findById").mockImplementationOnce(() => user);

      jest.spyOn(user, "save").mockImplementationOnce(() => {
        user.name = mockUserUpdateData.name;
        user.settings = mockUserUpdateData.settings;
        user.lastLoginDate = lastLoginDate;
        return user;
      });

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: UpdateUserInput!) {updateUser(input: $input) { name settings {defaultView taskRequestLimit} lastLoginDate }}`,
          variables: {
            input: mockUserUpdateData,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.data).toBeTruthy();
      expect(res.body.singleResult.data.updateUser).toEqual({
        ...mockUserUpdateData,
        lastLoginDate: lastLoginDate.toISOString(),
      });
      expect(res.body.singleResult.errors).toBeUndefined();
    });
    it("should throw error is user is not auth", async () => {
      const { User } = context.db;
      const contextValue = {
        db: context.db,
        authUser: false,
      };

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: UpdateUserInput!) {updateUser(input: $input) { name settings {defaultView taskRequestLimit} lastLoginDate }}`,
          variables: {
            input: mockUserUpdateData,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        "UNAUTHORIZED"
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.UNAUTHORIZED
      );
      expect(res.body.singleResult.data).toEqual(null);
    });
    it("should throw error if user not found", async () => {
      const { User } = context.db;
      const contextValue = {
        db: context.db,
        authUser: true,
      };

      jest.spyOn(User, "findById").mockImplementationOnce(() => null);

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: UpdateUserInput!) {updateUser(input: $input) { name settings {defaultView taskRequestLimit} lastLoginDate }}`,
          variables: {
            input: mockUserUpdateData,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        "NOT FOUND"
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.NOT_FOUND
      );
      expect(res.body.singleResult.data).toEqual(null);
    });
  });
});
