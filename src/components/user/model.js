const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { jwt } = require("../../helpers");
const {
  BCRYPT_SALT,
  JWT_SECRET,
  JWT_EXPIRATION,
  JWT_TYPE,
} = require("../../config");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      minlength: [5, "Name must be at least 5 characters long."],
      maxlength: [50, "Name must be at max 50 characters long."],
    },

    email: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Email address is not valid.",
      ],
      required: [true, "Email is required."],
      unique: true,
      minlength: [4, "Email must be at least 4 characters long."],
      maxlength: [50, "Email must be at max 50 characters long."],
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      validate: [
        {
          validator: (v) => {
            return /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/.test(v);
          },
          message:
            "Password should contain at least: one uppercase character, one lowercase character, one digit and one special character (@$!%*?&).",
        },
      ],
      minlength: [6, "Password must be at least 6 characters long."],
      maxlength: [72, "Password must be at max 72 characters long."],
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

  return {
    name: this.name,
    token: {
      accessToken: token,
      expiresIn: JWT_EXPIRATION,
      type: JWT_TYPE,
    },
  };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
