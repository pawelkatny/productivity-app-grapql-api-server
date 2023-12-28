const apolloHttpServer = require("../src/helpers/mockApolloHttpServer");
const request = require("supertest");
const context = require("../src/context");
const { jwt } = require("../src/helpers");
const { verify } = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
let server, url;

const bearer = "Bearer eyJhbGciOiJIUzI1NiJ9";

const mockUserUpdateData = {
  name: "John",
  settings: {
    defaultView: "year",
    taskRequestLimit: 100,
  },
};

beforeAll(async () => {
  ({ server, url } = await apolloHttpServer.create());
});

afterAll(async () => {
  await server.stop();
});
describe("User resolver e2e", () => {
  describe("deleteUser", () => {
    it("should return error when user not found", async () => {
      jest.spyOn(context.db.User, "findOne").mockImplementationOnce(() => null);
      const queryData = {
        query: `
          mutation DeleteUser($input: DeleteUserInput!) {
            deleteUser(input: $input)
          }
        `,
        variables: {
          input: {
            password: "password",
          },
        },
      };

      const res = await request(url).post("/").send(queryData);
      expect(res.body.errors[0].extensions.code).toEqual("UNAUTHORIZED");
      expect(res.body.data).toBeUndefined();
    });
  });
  describe("changeUserPassword", () => {
    it("should throw error if user is not found", async () => {
      jest.spyOn(jwt, "verify").mockImplementationOnce(() => true);
      jest.spyOn(context.db.User, "findOne").mockImplementationOnce(() => null);

      const queryData = {
        query: `
          mutation Mutation($input: ChangeUserPasswordInput!) 
            {
              changeUserPassword(input: $input)
            }
        `,
        variables: {
          input: {
            password: "password",
          },
        },
      };

      const res = await request(url)
        .post("/")
        .set("Authorization", bearer)
        .send(queryData);

      expect(res.body.errors[0].extensions.code).toEqual("UNAUTHORIZED");
      expect(res.body.errors[0].extensions.http.status).toEqual(
        StatusCodes.UNAUTHORIZED
      );
      expect(res.body.data).toBeUndefined();
    });
  });
  describe("updateUser", () => {
    it("should throw error if token is not valid", async () => {
      jest.spyOn(jwt, "verify").mockImplementationOnce(() => false);
      const queryData = {
        query: `
          mutation Mutation($input: UpdateUserInput!) 
          {
            updateUser(input: $input) 
            { 
              name 
              settings 
              {
                defaultView 
                taskRequestLimit
              } lastLoginDate 
            }
          }
        `,
        variables: {
          input: mockUserUpdateData,
        },
      };

      const res = await request(url)
        .post("/")
        .set("Authorization", bearer)
        .send(queryData);

      expect(res.body.errors[0].extensions.code).toEqual("UNAUTHORIZED");
      expect(res.body.errors[0].extensions.http.status).toEqual(
        StatusCodes.UNAUTHORIZED
      );
      expect(res.body.data).toBeUndefined();
    });
  });
});
