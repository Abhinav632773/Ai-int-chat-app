import { validationResult } from "express-validator";
import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import projectModel from "../models/project.model.js"; // ✅ Ensure this is imported
import * as projectService from "../services/project.service.js";

export const createProject = async (req, res) => {
  try {
    console.log("🔹 Request Body:", req.body); // Log incoming data

    const { name, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: "Name and UserId are required" });
    }

    const project = await projectModel.create({ name, userId, users: [userId] });
    res.status(201).json(project);
  } catch (error) {
    console.error("❌ Error creating project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getAllProjects = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    if (!loggedInUser) return res.status(404).json({ error: "User not found" });

    const allUserProjects = await projectService.getAllProjectsByUserId({ userId: loggedInUser._id });
    return res.status(200).json({ projects: allUserProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const addUsersToProject = async (req, res) => {
  try {
    const { projectId, users } = req.body;

    console.log("Received projectId:", projectId);
    console.log("Received users:", users);

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: "Invalid projectId" });
    }

    if (!Array.isArray(users) || users.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: "Invalid userId(s) in users array" });
    }

    // 🔹 Validate if users exist
    const existingUsers = await userModel.find({ _id: { $in: users } });
    const existingUserIds = existingUsers.map(user => user._id.toString());

    if (existingUserIds.length !== users.length) {
      return res.status(400).json({ error: "Some users do not exist" });
    }

    // 🔹 Update project: Append new user IDs to the `users` array
    const updatedProject = await projectModel.findByIdAndUpdate(
      projectId,
      { $addToSet: { users: { $each: existingUserIds } } }, // ✅ Prevent duplicate entries
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.status(200).json({ message: "Users added successfully", project: updatedProject });
  } catch (error) {
    console.error("Error adding users to project:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getProjectById = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await projectService.getProjectById({ projectId });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    return res.status(200).json({ project });
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const updateFileTree = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  try {

      const { projectId, fileTree } = req.body;

      const project = await projectService.updateFileTree({
          projectId,
          fileTree
      })

      return res.status(200).json({
          project
      })

  } catch (err) {
      console.log(err)
      res.status(400).json({ error: err.message })
  }

}