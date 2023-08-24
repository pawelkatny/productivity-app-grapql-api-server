const dbServer = require("../../helpers/dbServer");
const bcrypt = require("bcryptjs");
const User = require("./model");
const { jwt } = require("../../helpers");
const { BCRYPT_SALT, JWT_SECRET, JWT_EXPIRATION } = require("../../config");

jest.mock("../../config", () => ({
  BCRYPT_SALT: 10,
  JWT_SECRET: "secret",
  JWT_EXPIRATION: "1h",
}));

beforeAll(async () => {
  await dbServer.start();
  await User.create({
    name: "Default user",
    email: "default@test.com",
    password: "password",
  });
});

afterAll(async () => {
  await dbServer.stop();
});

const mockNewUser = {
  name: "Test user",
  email: "test@email.com",
  password: "testPassword",
};

describe("User model", () => {
  it("should create user and hash password on pre save", async () => {
    const genSalt = jest.spyOn(bcrypt, "genSalt").mockResolvedValueOnce("salt");
    const hash = jest
      .spyOn(bcrypt, "hash")
      .mockResolvedValueOnce("hashedPassword");
    const user = await User.create(mockNewUser);

    expect(genSalt).toHaveBeenCalledWith(BCRYPT_SALT);
    expect(hash).toHaveBeenCalledWith(mockNewUser.password, "salt");
    expect(user).toBeDefined();
    expect(user.password).toBe("hashedPassword");
  });

  it("should fetch user and create auth token", async () => {
    const sign = jest.spyOn(jwt, "sign").mockResolvedValueOnce("jwt_token");
    const user = await User.findOne();
    const token = await user.createAuthToken();

    expect(user).toBeTruthy();
    expect(sign).toBeCalledWith({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });
    expect(token).toBe("jwt_token");
  });
});
