import "dotenv/config.js";
import jwt from "jsonwebtoken";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";

const port = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    const projectId = socket.handshake.query.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid Project ID"));
    }

    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error("Authentication error: Invalid token"));
    }

    const project = await projectModel.findById(projectId);
    if (!project) {
      return next(new Error("Project not found"));
    }

    // Attach user and project to socket
    socket.user = decoded;
    socket.project = project;
    socket.roomId = project._id.toString();

    next();
  } catch (error) {
    console.error("🚨 Socket authentication error:", error.message);
    next(new Error("Authentication failed"));
  }
});

// Connection handler
io.on("connection", (socket) => {
  console.log(`✅ User ${socket.user._id} connected to project ${socket.roomId}`);

  // Join the project room
  socket.join(socket.roomId);

  // Message handler
  socket.on("project-message", async (data) => {
    try {
      if (!data || !data.message) {
        console.error("❌ Invalid message data received.");
        return;
      }

      // Step 1: Log incoming message
      console.log("📩 Received user message:", data);

      // Step 2: Send User's Message First
      const userMessageData = {
        ...data,
        _id: new mongoose.Types.ObjectId().toString(),
        timestamp: new Date().toISOString(), // Ensuring valid timestamp
        sender: socket.user._id,
        senderEmail: socket.user.email, // Ensure user's email is sent
      };

      console.log("✅ Sending user message to room:", socket.roomId);
      io.to(socket.roomId).emit("project-message", userMessageData);

      const content = userMessageData.message;
      console.log("📌 Processed message content:", content);

      // Step 3: Check if Message Contains "@ai" and Send AI Response
      if (content.includes("@ai")) {
        const prompt = content.replace("@ai", "").trim();
        console.log("🤖 AI Prompt:", prompt); // Debugging prompt

        try {
          const result = await generateResult(prompt);
          console.log("🔹 AI Response:", result); // Debugging AI response

          if (!result) {
            console.error("❌ AI response is empty!");
            return;
          }

          // Send AI response to all users (including sender)
          const aiMessage = {
            _id: new mongoose.Types.ObjectId().toString(),
            createdAt: new Date().toISOString(),
            message: result,
            sender: "AI",
            senderEmail: "AI reply",
          };

          console.log("✅ Sending AI message to room:", socket.roomId, aiMessage);
          io.to(socket.roomId).emit("project-message", aiMessage);
        } catch (aiError) {
          console.error("🚨 Error generating AI response:", aiError);
        }
      }
    } catch (error) {
      console.error("🚨 Error handling message:", error);
    }
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    console.log(`❌ User ${socket.user._id} disconnected`);
    socket.leave(socket.roomId);
  });

  // Error handler
  socket.on("error", (error) => {
    console.error("🚨 Socket error:", error);
  });
});

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🎧 Socket.IO listening for connections`);
});
