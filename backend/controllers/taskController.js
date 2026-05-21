const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const wrap = require("../middleware/asyncHandler");

const validStatuses = ["pending", "in-progress", "completed"];
const validPriorities = ["low", "medium", "high"];

function isGoodDate(val) {
  return !Number.isNaN(new Date(val).getTime());
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function badRequest(res, message) {
  res.status(400);
  throw new Error(message);
}

// makes sure the project exists and that the user has access to it
async function getProjectOrFail(projectId, user) {
  const project = await Project.findById(projectId);

  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }

  const memberIds = project.members.map(String);
  const allowed =
    user.role === "admin" ||
    project.createdBy.toString() === user._id.toString() ||
    memberIds.includes(user._id.toString());

  if (!allowed) {
    const err = new Error("You don't have access to this project");
    err.statusCode = 403;
    throw err;
  }

  return project;
}

// returns true if the user can work with this specific task
function canAccessTask(task, user, project) {
  return (
    user.role === "admin" ||
    task.assignedTo.toString() === user._id.toString() ||
    project.createdBy.toString() === user._id.toString() ||
    project.members.map(String).includes(user._id.toString())
  );
}

// POST /api/tasks
const createTask = wrap(async (req, res) => {
  const { title, description, status, priority, assignedTo, projectId, dueDate } = req.body;

  const taskTitle = String(title || "").trim();
  const taskDesc = String(description || "").trim();
  const taskStatus = status || "pending";
  const taskPriority = priority || "medium";

  if (!taskTitle || !taskDesc || !assignedTo || !projectId || !dueDate) {
    badRequest(res, "Title, description, assigned user, project, and due date are all required");
  }

  if (!validStatuses.includes(taskStatus)) badRequest(res, "Invalid status value");
  if (!validPriorities.includes(taskPriority)) badRequest(res, "Invalid priority value");
  if (!isGoodDate(dueDate)) badRequest(res, "Due date is not valid");

  if (!isValidId(assignedTo)) badRequest(res, "Assigned user ID is not valid");
  if (!isValidId(projectId)) badRequest(res, "Project ID is not valid");

  const project = await getProjectOrFail(projectId, req.user);

  if (!project.members.map(String).includes(String(assignedTo))) {
    badRequest(res, "That user is not a member of this project");
  }

  const task = await Task.create({
    title: taskTitle,
    description: taskDesc,
    status: taskStatus,
    priority: taskPriority,
    assignedTo,
    projectId,
    dueDate
  });

  const populated = await Task.findById(task._id)
    .populate("assignedTo", "name email role")
    .populate("projectId", "title");

  res.status(201).json(populated);
});

// GET /api/tasks/project/:projectId
const getTasksForProject = wrap(async (req, res) => {
  if (!isValidId(req.params.projectId)) badRequest(res, "Project ID is not valid");

  await getProjectOrFail(req.params.projectId, req.user);

  const filter = { projectId: req.params.projectId };

  // members only see tasks assigned to them
  if (req.user.role === "member") {
    filter.assignedTo = req.user._id;
  }

  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email role")
    .populate("projectId", "title")
    .sort({ dueDate: 1, createdAt: -1 });

  res.json(tasks);
});

// PUT /api/tasks/:id
const editTask = wrap(async (req, res) => {
  if (!isValidId(req.params.id)) badRequest(res, "Task ID is not valid");

  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const project = await getProjectOrFail(task.projectId, req.user);

  if (!canAccessTask(task, req.user, project)) {
    return res.status(403).json({ message: "You don't have access to this task" });
  }

  if (req.user.role === "member") {
    // members can only update the status of tasks assigned to them
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own tasks" });
    }

    if (req.body.status && !validStatuses.includes(req.body.status)) {
      badRequest(res, "Invalid status value");
    }

    task.status = req.body.status || task.status;
  } else {
    // admins can update any of these fields
    const editableFields = ["title", "description", "status", "priority", "assignedTo", "dueDate"];
    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    }

    if (task.title) task.title = String(task.title).trim();
    if (task.description) task.description = String(task.description).trim();

    if (task.status && !validStatuses.includes(task.status)) badRequest(res, "Invalid status value");
    if (task.priority && !validPriorities.includes(task.priority)) badRequest(res, "Invalid priority value");

    if (req.body.dueDate !== undefined && !isGoodDate(req.body.dueDate)) {
      badRequest(res, "Due date is not valid");
    }

    if (req.body.assignedTo !== undefined) {
      if (!isValidId(req.body.assignedTo)) badRequest(res, "Assigned user ID is not valid");
      if (!project.members.map(String).includes(String(req.body.assignedTo))) {
        badRequest(res, "That user is not a member of this project");
      }
    }
  }

  await task.save();

  const updated = await Task.findById(task._id)
    .populate("assignedTo", "name email role")
    .populate("projectId", "title");

  res.json(updated);
});

// DELETE /api/tasks/:id
const removeTask = wrap(async (req, res) => {
  if (!isValidId(req.params.id)) badRequest(res, "Task ID is not valid");

  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const project = await getProjectOrFail(task.projectId, req.user);

  if (!canAccessTask(task, req.user, project)) {
    return res.status(403).json({ message: "You don't have access to this task" });
  }

  await task.deleteOne();
  res.json({ message: "Task deleted" });
});

// GET /api/tasks/dashboard/stats
const getDashboardSummary = wrap(async (req, res) => {
  const base = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
  const now = new Date();

  const [total, done, waiting, late, recent] = await Promise.all([
    Task.countDocuments(base),
    Task.countDocuments({ ...base, status: "completed" }),
    Task.countDocuments({ ...base, status: "pending" }),
    Task.countDocuments({ ...base, dueDate: { $lt: now }, status: { $ne: "completed" } }),
    Task.find(base)
      .populate("assignedTo", "name email role")
      .populate("projectId", "title")
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  res.json({
    totalTasks: total,
    completedTasks: done,
    pendingTasks: waiting,
    overdueTasks: late,
    recentTasks: recent
  });
});

module.exports = {
  createTask,
  getTasksForProject,
  editTask,
  removeTask,
  getDashboardSummary
};
