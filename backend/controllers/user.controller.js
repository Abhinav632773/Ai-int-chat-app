import { validationResult } from "express-validator";
import userModel from "../models/user.model.js";
import * as userService from "../services/user.service.js";
import redisclient from "../services/redis.service.js";


export const createUserController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", existingUser.email);
      return res.status(400).json({ errors: "User already exists!" });
    }

    // Create new user
    const newUser = await userService.createUser({ email, password });

    // Generate token
    const token = await newUser.generateJWT();

    // Remove password before sending response
    const userWithoutPassword = { ...newUser._doc };
    delete userWithoutPassword.password;

    console.log("New user registered:", userWithoutPassword.email);
    console.log("Token:", token);

    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const loginController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      console.log("Login attempt failed: User not found", email);
      return res.status(401).json({ errors: "User not found! Please register first." });
    }

    // Validate password
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      console.log("Incorrect password attempt for:", email);
      return res.status(401).json({ errors: "Incorrect password!" });
    }

    // Generate JWT token
    const token = await user.generateJWT();
    
    // Remove password before sending response
    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    console.log("User logged in:", userWithoutPassword.email);
    res.status(200).json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const profileController = async (req, res) => {
  try {
    const userWithoutPassword = { ...req.user._doc };
    delete userWithoutPassword.password;
    
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


export const logoutController = async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    // ✅ Blacklist token using Redis (expires in 24 hours)
    await redisclient.set(token, "logout", "EX", 7 * 60 * 60 * 24);

    console.log("User logged out successfully");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllUsersController = async (req, res) => {
  try {
    // Get the logged-in user
    const loggedInUser = await userModel.findOne({ email: req.user.email });

    // Fetch all users except the logged-in user
    const allUsers = await userModel.find({ _id: { $ne: loggedInUser._id } });

    return res.status(200).json({ users: allUsers });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};


export const getUserIdsByEmails = async (req, res) => {
  try {
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: "Invalid email list" });
    }

    // 🔹 Find users by email and return only their _id fields
    const users = await userModel.find({ email: { $in: emails } }, "_id");
    const userIds = users.map(user => user._id.toString());

    res.json({ userIds });
  } catch (error) {
    console.error("Error fetching user IDs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getEmailsByUserIds = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "Invalid user ID list" });
    }

    // 🔹 Find users by _id and return only their email fields
    const users = await userModel.find({ _id: { $in: userIds } }, "email");
    const emails = users.map(user => user.email);

    res.json({ emails });
  } catch (error) {
    console.error("Error fetching user emails:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



