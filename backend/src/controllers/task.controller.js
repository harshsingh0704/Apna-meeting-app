import { Task } from "../models/task.model.js";
import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";

// @desc    Create a new task
// @route   POST /api/v1/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    const { description, meetingId, assigneeId, dueDate } = req.body;

    if (!description || !meetingId) {
      return res.status(400).json({ message: "Description and meetingId are required" });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (assigneeId) {
      const assignee = await User.findById(assigneeId);
      if (!assignee) {
        return res.status(404).json({ message: "Assignee user not found" });
      }
    }

    const task = await Task.create({
      description,
      meeting: meetingId,
      assignee: assigneeId,
      dueDate,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: `Error creating task: ${error.message}` });
  }
};

// @desc    Get all tasks for a meeting
// @route   GET /api/v1/tasks/meeting/:meetingId
// @access  Private
export const getTasksForMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const tasks = await Task.find({ meeting: meetingId }).populate('assignee', 'username');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: `Error getting tasks: ${error.message}` });
  }
};

// @desc    Update a task
// @route   PATCH /api/v1/tasks/:taskId
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description, status, assigneeId, dueDate } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (assigneeId) {
        const assignee = await User.findById(assigneeId);
        if (!assignee) {
          return res.status(404).json({ message: "Assignee user not found" });
        }
        task.assignee = assigneeId;
    }

    task.description = description || task.description;
    task.status = status || task.status;
    task.dueDate = dueDate || task.dueDate;

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};

// @desc    Delete a task
// @route   DELETE /api/v1/tasks/:taskId
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();

    res.status(200).json({ message: "Task removed" });
  } catch (error) {
    res.status(500).json({ message: `Error deleting task: ${error.message}` });
  }
};
