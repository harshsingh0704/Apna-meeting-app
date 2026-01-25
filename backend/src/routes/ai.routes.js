import express from "express";
import {
  askMeetingAI,
  summarizeMeeting,
  summarizeMeetingWithTasks,
} from "../controllers/aiMeeting.controller.js";

const router = express.Router();

router.post("/ask", askMeetingAI);
router.post("/summarize", summarizeMeeting);

// ✅ NEW
router.post("/summarize-tasks", summarizeMeetingWithTasks);

export default router;
