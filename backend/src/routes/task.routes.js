import { Router } from "express";
import {
  createTask,
  getTasksForMeeting,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", auth, createTask);
router.get("/meeting/:meetingId", auth, getTasksForMeeting);
router.patch("/:taskId", auth, updateTask);
router.delete("/:taskId", auth, deleteTask);

export default router;
