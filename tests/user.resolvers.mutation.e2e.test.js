const apolloHttpServer = require("../src/helpers/mockApolloHttpServer");
const request = require("supertest");
const context = require("../src/context");
let server, url;

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
});
