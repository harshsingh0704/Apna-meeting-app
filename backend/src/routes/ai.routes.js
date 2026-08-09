import express from "express";
import {
  askMeetingAI,
  summarizeMeeting,
  summarizeMeetingWithTasks,
  getSentiment,
  detectDecisions,
  detectConfusion,
  extractActionItems,
} from "../controllers/aiMeeting.controller.js";

const router = express.Router();

router.post("/ask", askMeetingAI);
router.post("/summarize", summarizeMeeting);
router.post("/summarize-tasks", summarizeMeetingWithTasks);
router.post("/detect-decisions", detectDecisions);
router.post("/detect-confusion", detectConfusion);
router.post("/extract-actions", extractActionItems);
router.post("/sentiment", getSentiment);

export default router;
