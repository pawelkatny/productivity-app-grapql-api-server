const apolloHttpServer = require("../src/helpers/mockApolloHttpServer");
const request = require("supertest");
const { StatusCodes } = require("http-status-codes");
let server, url;

beforeAll(async () => {
  ({ server, url } = await apolloHttpServer.create());
});

afterAll(async () => {
  await server.stop();
});
describe("User resolver e2e", () => {
  describe("getUser", () => {
    it("should throw error if token is missing", async () => {
      const queryData = {
        query: `
        query Query 
        { 
          getUser 
          { 
            name, 
            settings 
            { 
              defaultView, 
              taskRequestLimit 
            } 
            lastLoginDate 
          }
        }`,
      };

      const res = await request(url)
        .post("/")
        .set("Authorization", "")
        .send(queryData);
      expect(res.body.errors[0].extensions.code).toEqual("UNAUTHORIZED");
      expect(res.body.errors[0].extensions.http.status).toEqual(
        StatusCodes.UNAUTHORIZED
      );
      expect(res.body.data).toBeUndefined();
    });
  });
});
