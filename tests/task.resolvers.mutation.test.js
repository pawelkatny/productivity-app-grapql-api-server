const apolloServer = require("../src/helpers/mockApolloServer");
const context = require("../src/context");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");

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

const mockUpdatedTaskData = {
  name: "Updated test task",
  notes: "Updated test description",
  date: "2023-10-23",
  isCompleted: true,
  priority: "common",
};

describe("Task resolver mutations", () => {
  describe("createTask", () => {
    it("should successfully create new task", async () => {
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

      jest.spyOn(Task, "create").mockImplementationOnce(() => {
        task._doc.createdAt = new Date();
        task._doc.updatedAt = new Date();
        return task;
      });

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: CreateTaskInput!) { createTask(input: $input) { id name type }}`,
          variables: {
            input: mockTaskData,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.data.createTask).toEqual({
        id: task._id.toString(),
        name: task.name,
        type: task.type,
      });
      expect(res.body.singleResult.errors).toBeUndefined();
    });
    it("should throw error when task was not created", async () => {
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

      jest.spyOn(Task, "create").mockImplementationOnce(() => null);

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: CreateTaskInput!) { createTask(input: $input) { id name type }}`,
          variables: {
            input: mockTaskData,
          },
        },
        {
          contextValue,
        }
      );

      expect(res.body.singleResult.errors[0].extensions.code).toEqual(
        "INTERNAL SERVER ERROR"
      );
      expect(res.body.singleResult.errors[0].extensions.http.status).toEqual(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      expect(res.body.singleResult.data).toEqual(null);
    });
  });
  describe("updateTask", () => {
    it("should successfully update task", async () => {
      const { User, Task } = context.db;
      const user = new User(mockUserData);
      const task = new Task({ ...mockTaskData, user: user._id });
      mockUpdatedTaskData.id = task._id.toString();

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
      jest.spyOn(task, "save").mockImplementationOnce(() => {
        return mockUpdatedTaskData;
      });

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: UpdateTaskInput!) { updateTask(input: $input) { id name notes isCompleted }}`,
          variables: {
            input: mockUpdatedTaskData,
          },
        },
        {
          contextValue,
        }
      );

      const { id, name, notes, isCompleted } = mockUpdatedTaskData;
      expect(res.body.singleResult.data.updateTask).toEqual({
        id,
        name,
        notes,
        isCompleted,
      });
      expect(res.body.singleResult.errors).toBeUndefined();
    });
    it("should throw error when task was not found", async () => {
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
        return null;
      });

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($input: UpdateTaskInput!) { updateTask(input: $input) { id name notes isCompleted }}`,
          variables: {
            input: {
              ...mockUpdatedTaskData,
              id: task._id.toString(),
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
  });
  describe("deleteTask", () => {
    it("should successfully delete task", async () => {
      const { Task } = context.db;
      const task = new Task(mockTaskData);
      const deleteTaskId = task._id.toString();
      const contextValue = {
        db: context.db,
        authUser: true,
      };

      const findByIdAndDelete = jest
        .spyOn(Task, "findByIdAndDelete")
        .mockImplementationOnce(() => true);
      jest.spyOn(Task, "exists").mockImplementationOnce(() => {
        return false;
      });

      const res = await server.executeOperation(
        {
          query: `mutation Mutation($deleteTaskId: ID!) { deleteTask(id: $deleteTaskId)}`,
          variables: {
            deleteTaskId,
          },
        },
        {
          contextValue,
        }
      );

      expect(findByIdAndDelete).toHaveBeenCalledWith(deleteTaskId);
      expect(res.body.singleResult.data.deleteTask).toBeTruthy();
      expect(res.body.singleResult.errors).toBeUndefined();
    });
  });
});
