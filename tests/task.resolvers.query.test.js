const apolloServer = require("../src/helpers/mockApolloServer");
const context = require("../src/context");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { Query } = require("../src/components/task/resolvers");
let server;

beforeAll(async () => {
  server = apolloServer.create();
});

afterAll(async () => {
  server.stop();
});

const mockUserData = {
  email: "test@email.com",
  name: "Johny",
  password: "paS$w0rd",
  lastLoginDate: new Date(),
};

const mockTaskData = {
  name: "Test task",
  type: "day",
  notes: "Test description",
};

describe("Task resolver queries", () => {
  describe("getTask", () => {
    it("should successfully retrieve task", async () => {
      const { User, Task } = context.db;
      const user = new User(mockUserData);
      const task = new Task(mockTaskData);

      const contextValue = {
        db: context.db,
        auth: {
          user: {
            userId: user._id.toString(),
          },
        },
      };

      jest.spyOn(Task, "findOne").mockImplementationOnce(() => {
        task._doc.createdAt = new Date();
        task._doc.updatedAt = new Date();
        return task;
      });

      const res = await server.executeOperation(
        {
          query: `query Query($getTaskId: ID!) { getTask(id: $getTaskId) { id name type }}`,
          variables: {
            getTaskId: task._id.toString(),
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.data.getTask).toEqual({
        id: task._id.toString(),
        name: task.name,
        type: task.type,
      });
      expect(res.body.singleResult.errors).toBeUndefined();
    });
    it("should throw error is user is not auth", async () => {
      const { Task } = context.db;
      const task = new Task(mockTaskData);
      const contextValue = {
        db: context.db,
        authUser: false,
      };

      const res = await server.executeOperation(
        {
          query: `query Query($getTaskId: ID!) { getTask(id: $getTaskId) { id name type }}`,
          variables: {
            getTaskId: task._id.toString(),
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
    it("should throw error if task is not found", async () => {
      const { User, Task } = context.db;
      const user = new User(mockUserData);
      const task = new Task(mockTaskData);

      const contextValue = {
        db: context.db,
        auth: {
          user: {
            userId: user._id.toString(),
          },
        },
      };

      jest.spyOn(Task, "findOne").mockImplementationOnce(() => null);

      const res = await server.executeOperation(
        {
          query: `query Query($getTaskId: ID!) { getTask(id: $getTaskId) { id name type }}`,
          variables: {
            getTaskId: task._id.toString(),
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors[0].message).toEqual(
        getReasonPhrase(StatusCodes.NOT_FOUND)
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.NOT_FOUND
      );
      expect(res.body.singleResult.data).toEqual(null);
    });
  });
  describe("getTasks", () => {
    it("should successfully return task list for specific day", async () => {
      const { User, Task } = context.db;
      const user = new User(mockUserData);
      const task = new Task(mockTaskData);
      task._doc.createdAt = new Date();
      task._doc.updatedAt = new Date();

      const { _id, name, type, date } = task;
      const expectedTask = {
        id: _id.toString(),
        name,
        type,
        date: date.toISOString(),
      };
      const contextValue = {
        db: context.db,
        auth: {
          user: {
            userId: user._id.toString(),
          },
        },
      };

      const params = {
        view: "day",
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        page: 1,
      };

      jest.spyOn(Task, "getSingleList").mockImplementationOnce(() => {
        return {
          tasks: [expectedTask],
          count: 1,
          nextPage: 0,
        };
      });

      const res = await server.executeOperation(
        {
          query: `query GetTasks($params: TasksQueryParams!) { getTasks(params: $params) { ... on TaskSingleListView { tasks {id name type date} count nextPage}}}`,
          variables: {
            params,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.data.getTasks).toEqual({
        tasks: [expectedTask],
        count: 1,
        nextPage: 0,
      });
      expect(res.body.singleResult.errors).toBeUndefined();
    });
  });
  it("should succesfully return tasks list for week view", async () => {
    const { User, Task } = context.db;
    const user = new User(mockUserData);
    const task = new Task(mockTaskData);

    const { _id, name, type, date } = task;
    const { _id: userId, settings } = user;
    const expectedTask = {
      id: _id.toString(),
      name,
      type,
      date: date.toISOString(),
    };
    const contextValue = {
      db: context.db,
      auth: {
        user: {
          userId: userId.toString(),
          settings,
        },
      },
    };

    const params = {
      view: "week",
      start: new Date().toISOString(),
      end: new Date(new Date().getDate() + 6).toISOString(),
      page: 1,
    };

    jest.spyOn(Task, "aggregate").mockImplementationOnce(() => {
      return [
        {
          tasks: [expectedTask, expectedTask],
          count: 2,
          page: 1,
          nextPage: 0,
        },
      ];
    });

    const res = await server.executeOperation(
      {
        query: `query GetTasks($params: TasksQueryParams!) { getTasks(params: $params) { 
            ... on TaskAggregatedListView { 
              tasks {
                tasks {
                  id name type date
                } 
                count
                page 
                nextPage
              } 
            }
          }
        }`,
        variables: {
          params,
        },
      },
      {
        contextValue,
      }
    );

    expect(res.body.singleResult.data.getTasks).toEqual({
      tasks: [
        {
          tasks: [expectedTask, expectedTask],
          count: 2,
          page: 1,
          nextPage: 0,
        },
      ],
    });
    expect(res.body.singleResult.errors).toBeUndefined();
  });
});
