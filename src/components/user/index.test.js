const config = require("../../config");
const dbServer = require("../../helpers/dbServer");
const bcrypt = require("bcryptjs");
const User = require("./model");

beforeAll(async () => {
  await dbServer.start();
});

afterAll(async () => {
  await dbServer.stop();
});

const mockNewUser = {
  name: "Test user",
  email: "test@email.com",
  password: "testPassword",
};

describe("User schema pre save and methods", () => {
  it("should create user and hash password on pre save", async () => {
    const genSalt = jest.spyOn(bcrypt, "genSalt").mockResolvedValueOnce("salt");
    const hash = jest
      .spyOn(bcrypt, "hash")
      .mockResolvedValueOnce("hashedPassword");
    const user = await User.create(mockNewUser);

    expect(genSalt).toHaveBeenCalledWith(config.BCRYPT_SALT);
    expect(hash).toHaveBeenCalledWith(mockNewUser.password, "salt");
    expect(user).toBeDefined();
    expect(user.password).toBe("hashedPassword");
  });
});
