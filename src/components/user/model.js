const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { BCRYPT_SALT } = require("../../config");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      maxlength: 50,
    },

    email: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Email address is not valid.",
      ],
      required: [true, "Email is required."],
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
    const salt = await bcrypt.salt(BCRYPT_SALT);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
