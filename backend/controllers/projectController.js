const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const wrap = require("../middleware/asyncHandler");

// quick ObjectId check so we don't hit mongo with garbage
function checkObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(label);
    err.statusCode = 400;
    throw err;
  }
}

// deduplicate and stringify member id array
function dedupeMembers(arr) {
  const valid = Array.isArray(arr) ? arr : [];
  return [...new Set(valid.filter(Boolean).map(String))];
}

// GET /api/projects
const fetchProjects = wrap(async (req, res) => {
  // admins see everything, members only see projects they belong to
  const query =
    req.user.role === "admin"
      ? {}
      : { $or: [{ members: req.user._id }, { createdBy: req.user._id }] };

  const projects = await Project.find(query)
    .populate("createdBy", "name email role")
    .populate("members", "name email role")
    .sort({ createdAt: -1 });

  res.json(projects);
});

// POST /api/projects
const addProject = wrap(async (req, res) => {
  const { title, description, members = [] } = req.body;

  const projectTitle = String(title || "").trim();
  const projectDesc = String(description || "").trim();

  if (!projectTitle || !projectDesc) {
    res.status(400);
    throw new Error("Project title and description are required");
  }

  // validate each member id before touching the db
  for (const mid of members) {
    if (!mongoose.Types.ObjectId.isValid(mid)) {
      res.status(400);
      throw new Error("One or more member IDs are not valid");
    }
  }

  // creator is automatically added to the member list
  const memberList = dedupeMembers([req.user._id.toString(), ...members]);

  const project = await Project.create({
    title: projectTitle,
    description: projectDesc,
    createdBy: req.user._id,
    members: memberList
  });

  // return the populated version so the client has full user details
  const result = await Project.findById(project._id)
    .populate("createdBy", "name email role")
    .populate("members", "name email role");

  res.status(201).json(result);
});

// GET /api/projects/:id
const fetchProjectById = wrap(async (req, res) => {
  checkObjectId(req.params.id, "That project ID doesn't look right");

  const project = await Project.findById(req.params.id)
    .populate("createdBy", "name email role")
    .populate("members", "name email role");

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const canView =
    req.user.role === "admin" ||
    project.createdBy._id.toString() === req.user._id.toString() ||
    project.members.some((m) => m._id.toString() === req.user._id.toString());

  if (!canView) {
    return res.status(403).json({ message: "You don't have access to this project" });
  }

  // for members, only count their own tasks
  const taskQuery =
    req.user.role === "admin"
      ? { projectId: project._id }
      : { projectId: project._id, assignedTo: req.user._id };

  const taskCount = await Task.countDocuments(taskQuery);

  res.json({ ...project.toObject(), taskCount });
});

module.exports = { fetchProjects, addProject, fetchProjectById };
