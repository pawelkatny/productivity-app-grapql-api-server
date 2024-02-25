const apolloHttpServer = require("../tests_helpers/mockApolloHttpServer");
const request = require("supertest");
const context = require("../src/context");
const { jwt } = require("../src/helpers");
const { verify } = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
let server, url;

const bearer = "Bearer eyJhbGciOiJIUzI1NiJ9";

const mockTaskData = {
  name: "Test task",
  type: "day",
  notes: "Test description",
};

jest.mock("../src/loaders/redis", () => {
  return {
    get: jest.fn(),
  };
});

const redis = require("../src/loaders/redis");

beforeAll(async () => {
  ({ server, url } = await apolloHttpServer.create());
});

afterAll(async () => {
  await server.stop();
});
describe("Task query resolver e2e", () => {
  describe("getTask", () => {
    it("should throw error is user is not auth", async () => {
      const { Task } = context.db;
      const task = new Task(mockTaskData);

      jest.spyOn(jwt, "verify").mockImplementationOnce(() => null);

      const queryData = {
        query: `
          query Query($getTaskId: ID!) { 
            getTask(id: $getTaskId) { 
              id name type 
            }
          }`,
        variables: {
          getTaskId: task._id.toString(),
        },
      };

      const res = await request(url).post("/").send(queryData);

      expect(res.body.errors[0].extensions.code).toEqual("UNAUTHORIZED");
      expect(res.body.errors[0].extensions.http.status).toEqual(
        StatusCodes.UNAUTHORIZED
      );
      expect(res.body.data).toBeUndefined();
    });
  });
});
