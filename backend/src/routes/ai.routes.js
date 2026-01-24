import express from "express";
import {
  askMeetingAI,
  summarizeMeeting,
} from "../controllers/aiMeeting.controller.js";

const router = express.Router();

router.post("/ask", askMeetingAI);
router.post("/summarize", summarizeMeeting);

export default router;
