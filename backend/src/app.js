import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import taskRoutes from "./routes/task.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";

const app = express();
const server = createServer(app);

connectToSocket(server);

app.set("port", process.env.PORT || 8000);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/meeting", meetingRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/calendar", calendarRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is up and running",
  });
});

const start = async () => {
  try {
    const connectionDb = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'zoomdb' // Explicitly set database name (lowercase) to match existing database
    });

    console.log(
      `✅ MONGO Connected DB Host: ${connectionDb.connection.host}, Database: ${connectionDb.connection.name}`
    );

    server.listen(app.get("port"), () => {
      console.log(`🚀 SERVER running on port ${app.get("port")}`);
    });
  } catch (error) {
    console.error("❌ Mongo connection failed:", error.message);
    process.exit(1);
  }
};

start();
