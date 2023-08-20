const mongoose = require("mongoose");

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

const User = mongoose.model("User", userSchema);

module.exports = User;
