const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Task name is required."],
      minlength: 5,
      maxlength: 50,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["day", "year"],
      default: "day",
    },

    date: {
      type: Date,
      required: true,
      default: new Date(),
    },

    isCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },

    completionDate: {
      type: Date,
    },

    notes: {
      type: String,
      maxlength: 500,
    },

    priority: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", userSchema);

module.exports = Task;
