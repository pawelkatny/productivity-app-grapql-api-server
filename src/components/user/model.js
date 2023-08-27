const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { jwt } = require("../../helpers");
const { BCRYPT_SALT, JWT_SECRET, JWT_EXPIRATION } = require("../../config");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      minlength: 5,
      maxlength: 50,
    },

    email: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Email address is not valid.",
      ],
      required: [true, "Email is required."],
      unique: true,
      minlength: 4,
      maxlength: 50,
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      maxlength: 72,
    },

    active: {
      type: Boolean,
      default: false,
    },

    accountActivation: {
      token: {
        type: String,
        default: null,
        maxlength: 24,
      },
      expireAt: {
        type: Date,
      },
    },

    passwordReset: {
      token: {
        type: String,
        default: null,
        maxlength: 24,
      },
      expireAt: {
        type: Date,
      },
    },

    expireAt: {
      type: Date,
      default: new Date(new Date().valueOf() + 604800000),
      expires: 60,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  const updatedFields = this.modifiedPaths();
  if (updatedFields.includes("password")) {
    const salt = await bcrypt.genSalt(Number(BCRYPT_SALT));
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.comparePwd = async function (inputPwd) {
  const isMatch = await bcrypt.compare(inputPwd, this.password);
  return isMatch;
};

userSchema.methods.createAuthToken = async function () {
  const token = await jwt.sign({ userId: this._id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
