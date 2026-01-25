import dotenv from "dotenv";
dotenv.config(); // 👈 sabse pehle

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

/* ===================== AI ROUTES IMPORT ===================== */
import aiRoutes from "./routes/ai.routes.js";
/* ============================================================ */




import meetingRoutes from "./routes/meeting.routes.js";





const app = express();
const server = createServer(app);
connectToSocket(server);

app.set("port", process.env.PORT || 8000);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

/* ===================== USER ROUTES ===================== */
app.use("/api/v1/users", userRoutes);
/* ====================================================== */

/* ===================== AI ROUTES ===================== */
app.use("/api/v1/ai", aiRoutes);
/* 👉 AI endpoint example:
   POST http://localhost:8000/api/v1/ai/ask
*/
/* ==================================================== */



app.use("/api/v1/meeting", meetingRoutes);




const start = async () => {
  try {
    console.log("MONGO_URI =>", process.env.MONGO_URI); // 🔍 debug

    const connectionDb = await mongoose.connect(process.env.MONGO_URI);

    console.log(
      `✅ MONGO Connected DB Host: ${connectionDb.connection.host}`
    );

    server.listen(app.get("port"), () => {
      console.log(`🚀 SERVER running on port ${app.get("port")}`);
    });
  } catch (error) {
    console.error("❌ Mongo connection failed:", error.message);
  }
};

start();
