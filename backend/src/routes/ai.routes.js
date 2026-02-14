import express from "express";
import {
  askMeetingAI,
  summarizeMeeting,
  summarizeMeetingWithTasks,
  getSentiment,
} from "../controllers/aiMeeting.controller.js";

const router = express.Router();

router.post("/ask", askMeetingAI);
router.post("/summarize", summarizeMeeting);
router.post("/summarize-tasks", summarizeMeetingWithTasks);
router.post("/sentiment", getSentiment);

export default router;
