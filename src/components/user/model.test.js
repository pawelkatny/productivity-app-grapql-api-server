const dbServer = require("../../helpers/dbServer");
const bcrypt = require("bcryptjs");
const User = require("./model");
const { jwt } = require("../../helpers");
const { BCRYPT_SALT, JWT_SECRET, JWT_EXPIRATION } = require("../../config");
const { default: mongoose } = require("mongoose");

jest.mock("../../config", () => ({
  BCRYPT_SALT: 10,
  JWT_SECRET: "secret",
  JWT_EXPIRATION: "1h",
}));

const defaultUser = {
  name: "Default user",
  email: "default@test.com",
  password: "password",
};

const mockNewUser = {
  name: "Test user",
  email: "test@email.com",
  password: "testPassword",
};

beforeAll(async () => {
  await dbServer.start();
  await User.create(defaultUser);
});

afterAll(async () => {
  await dbServer.stop();
});

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

  it("should throw duplicate key error when creating user with already used email", async () => {
    jest.spyOn(User, "create");
    let newUser, error;

    try {
      newUser = await User.create(defaultUser);
    } catch (err) {
      error = err;
    }

    expect(newUser).toBeFalsy();
    expect(error.code).toBe(11000);
  });
});
