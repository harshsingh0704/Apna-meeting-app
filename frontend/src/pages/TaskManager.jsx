import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Modal,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import server from "../environment";

const TaskManager = () => {
  const { getHistoryOfUser, token } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState({});
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [open, setOpen] = useState(false);

  // New Task State
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  const apiBaseUrl = `${server}/api/v1`;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history || []);
      } catch (err) {
        console.log("History error:", err);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/users/get_all_users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setUsers(data || []);
      } catch (err) {
        console.log("Users error:", err);
      }
    };

    fetchHistory();
    fetchUsers();
  }, [getHistoryOfUser, token]);

  const handleOpen = async (meeting) => {
    setSelectedMeeting(meeting);
    await fetchTasks(meeting._id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMeeting(null);
    setDescription("");
    setAssignee("");
    setDueDate("");
  };

  const fetchTasks = async (meetingId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/tasks/meeting/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTasks((prev) => ({ ...prev, [meetingId]: data }));
    } catch (err) {
      console.log("Tasks error:", err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!description || !selectedMeeting) return;

    try {
      const response = await fetch(`${apiBaseUrl}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description,
          meetingId: selectedMeeting._id,
          assigneeId: assignee,
          dueDate,
        }),
      });

      if (response.ok) {
        await fetchTasks(selectedMeeting._id);
        // Clear form
        setDescription("");
        setAssignee("");
        setDueDate("");
      } else {
        console.error("Failed to create task");
      }
    } catch (err) {
      console.error("Create task error:", err);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
        const response = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
        });

        if (response.ok) {
            await fetchTasks(selectedMeeting._id);
        } else {
            console.error('Failed to update task');
        }
    } catch (err) {
        console.error('Update task error:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchTasks(selectedMeeting._id);
      } else {
        console.error('Failed to delete task');
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        📝 Task Manager
      </Typography>

      {meetings.map((meeting) => (
        <Card key={meeting._id} variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Code: {meeting.meetingCode}
            </Typography>
            <Typography variant="h5" component="div">
              {new Date(meeting.date).toLocaleDateString()}
            </Typography>
            <Button onClick={() => handleOpen(meeting)}>Manage Tasks</Button>
          </CardContent>
        </Card>
      ))}

      {selectedMeeting && (
        <Modal open={open} onClose={handleClose}>
          <Box sx={{ ...modalStyle }}>
            <Typography variant="h6">Tasks for {selectedMeeting.meetingCode}</Typography>

            {/* Create Task from Action Item */}
            <Box mt={2}>
              <Typography variant="subtitle1">Action Items</Typography>
              {selectedMeeting.actionItems.map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  onClick={() => setDescription(item)}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>

            {/* New Task Form */}
            <form onSubmit={handleCreateTask}>
              <TextField
                label="Task Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Assign To</InputLabel>
                <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} label="Assign To">
                  <MenuItem value=""><em>None</em></MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>{user.username}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <Button type="submit" variant="contained">Create Task</Button>
            </form>

            {/* Task List */}
            <Box mt={4}>
              <Typography variant="subtitle1">Existing Tasks</Typography>
              {tasks[selectedMeeting._id]?.map((task) => (
                <Card key={task._id} sx={{ mt: 1 }}>
                  <CardContent>
                    <Typography>{task.description}</Typography>
                    <Typography variant="body2">Status: {task.status}</Typography>
                    <Typography variant="body2">Assignee: {task.assignee?.username || 'Unassigned'}</Typography>
                    <Typography variant="body2">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</Typography>
                    <Button onClick={() => handleUpdateTaskStatus(task._id, task.status === 'todo' ? 'done' : 'todo')}>
                      Mark as {task.status === 'todo' ? 'Done' : 'Todo'}
                    </Button>
                    <Button onClick={() => handleDeleteTask(task._id)} color="error">Delete</Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </Modal>
      )}
    </div>
  );
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto'
};

export default TaskManager;