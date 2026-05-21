const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned team member is required"]
    },
    // link back to the parent project
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
