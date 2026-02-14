// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import dayjs from "dayjs";
import server from "../environment";

const fieldSx = {
  "& .MuiInputBase-root": {
    backgroundColor: "rgba(2,6,23,0.55)",
    borderRadius: "12px",
    color: "#E2E8F0",
  },
  "& .MuiInputLabel-root": { color: "#94A3B8" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#60A5FA" },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(51,65,85,0.8)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(96,165,250,0.8)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#2563EB",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#94A3B8",
    opacity: 1,
  },
};

const primaryBtnSx = {
  borderRadius: 2.5,
  fontWeight: 900,
  textTransform: "none",
  background: "linear-gradient(90deg, rgba(37,99,235,1), rgba(96,165,250,1))",
  boxShadow: "0 10px 20px rgba(37,99,235,0.25)",
  "&:hover": {
    boxShadow: "0 14px 30px rgba(37,99,235,0.35)",
  },
};

const CalendarPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attendeeInput, setAttendeeInput] = useState("");
 const [attendees, setAttendees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [meetings, setMeetings] = useState([]);

  const apiBase = `${server}/api/v1/calendar`;

  const loadMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) setMeetings(data || []);
    } catch (err) {
      console.error("Load meetings error:", err);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleAddAttendee = () => {
    if (!attendeeInput.trim()) return;
    setAttendees((prev) =>
      prev.includes(attendeeInput.trim())
        ? prev
        : [...prev, attendeeInput.trim()]
    );
    setAttendeeInput("");
  };

  const handleRemoveAttendee = (email) => {
    setAttendees((prev) => prev.filter((e) => e !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!title || !startTime || !endTime) {
      setError("Title, start time and end time are required.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          startTime,
          endTime,
          attendees,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to schedule meeting");
        return;
      }

      setMessage(
        `Meeting scheduled! Code: ${data.meetingCode}. You can share this with participants.`
      );

      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setAttendees([]);

      await loadMeetings();
    } catch (err) {
      console.error("Schedule error:", err);
      setError("Something went wrong while scheduling.");
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (value) =>
    value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 10% 10%, rgba(37,99,235,0.18) 0%, rgba(2,6,23,1) 55%)",
        py: 3,
      }}
    >
      <Container maxWidth="md">
        {/* Top bar */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(2,6,23,0.65)",
            border: "1px solid rgba(51,65,85,0.5)",
            borderRadius: 3,
            px: 2,
            py: 1.5,
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <IconButton
            onClick={() => (window.location.href = "/home")}
            sx={{
              color: "#E2E8F0",
              border: "1px solid rgba(51,65,85,0.8)",
              borderRadius: 2,
            }}
            title="Back to Home"
          >
            <HomeIcon />
          </IconButton>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "white" }}>
              📅 Schedule a Meeting
            </Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: 13 }}>
              Create a meeting code and share it with attendees.
            </Typography>
          </Box>
        </Box>

        <Paper
          sx={{
            p: 0,
            mb: 3,
            borderRadius: 4,
            border: "1px solid rgba(51,65,85,0.8)",
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))",
            color: "white",
          }}
          elevation={0}
        >
          <Box
            sx={{
              height: 4,
              background:
                "linear-gradient(90deg, rgba(37,99,235,1), rgba(96,165,250,1))",
            }}
          />
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography sx={{ fontSize: 16, fontWeight: 900, mb: 0.5 }}>
              Schedule details
            </Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: 13, mb: 2 }}>
              Title and time are required. You can optionally add attendee emails.
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Title"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  size="small"
                  sx={fieldSx}
                />

                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  size="small"
                  sx={fieldSx}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Start Time"
                    type="datetime-local"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    size="small"
                    sx={fieldSx}
                  />
                  <TextField
                    label="End Time"
                    type="datetime-local"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    size="small"
                    sx={fieldSx}
                  />
                </Stack>

                <Box>
                  <Typography sx={{ mb: 1, fontWeight: 900, fontSize: 14 }}>
                    Attendees (emails)
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      fullWidth
                      placeholder="friend@example.com"
                      value={attendeeInput}
                      onChange={(e) => setAttendeeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddAttendee()}
                      size="small"
                      sx={fieldSx}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddAttendee}
                      startIcon={<AddIcon />}
                      sx={primaryBtnSx}
                    >
                      Add
                    </Button>
                  </Stack>
                  <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {attendees.map((email) => (
                      <Chip
                        key={email}
                        label={email}
                        onDelete={() => handleRemoveAttendee(email)}
                        sx={{
                          background: "rgba(30,41,59,0.85)",
                          color: "white",
                          border: "1px solid rgba(51,65,85,0.8)",
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                {error && (
                  <Box
                    sx={{
                      border: "1px solid rgba(239,68,68,0.35)",
                      background: "rgba(239,68,68,0.08)",
                      borderRadius: 3,
                      p: 1.2,
                    }}
                  >
                    <Typography sx={{ color: "#FCA5A5", fontSize: 13 }}>
                      {error}
                    </Typography>
                  </Box>
                )}

                {message && (
                  <Box
                    sx={{
                      border: "1px solid rgba(34,197,94,0.35)",
                      background: "rgba(34,197,94,0.10)",
                      borderRadius: 3,
                      p: 1.2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography sx={{ color: "#86EFAC", fontSize: 13 }}>
                      {message}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => {
                        const match = String(message).match(/Code:\s*([A-Za-z0-9_-]+)/i);
                        const code = match?.[1];
                        if (code) navigator.clipboard?.writeText(code);
                      }}
                      sx={{
                        borderRadius: 2.5,
                        textTransform: "none",
                        borderColor: "rgba(134,239,172,0.5)",
                        color: "#86EFAC",
                        "&:hover": {
                          borderColor: "rgba(134,239,172,0.85)",
                          background: "rgba(34,197,94,0.10)",
                        },
                      }}
                    >
                      Copy code
                    </Button>
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{ ...primaryBtnSx, alignSelf: "flex-start", mt: 0.5 }}
                >
                  {saving ? "Scheduling..." : "Schedule Meeting"}
                </Button>
              </Stack>
            </form>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 0,
            borderRadius: 4,
            border: "1px solid rgba(51,65,85,0.8)",
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))",
            color: "white",
          }}
          elevation={0}
        >
          <Box
            sx={{
              height: 4,
              background:
                "linear-gradient(90deg, rgba(37,99,235,1), rgba(96,165,250,1))",
            }}
          />
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography sx={{ fontSize: 16, fontWeight: 900, mb: 0.5 }}>
              🗓 Your Scheduled Meetings
            </Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: 13, mb: 2 }}>
              Upcoming meetings you created.
            </Typography>

            {meetings.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  border: "1px dashed rgba(51,65,85,0.8)",
                  background: "rgba(2,6,23,0.45)",
                  borderRadius: 4,
                  p: 3,
                }}
              >
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: "white" }}>
                  No scheduled meetings yet
                </Typography>
                <Typography sx={{ mt: 1, color: "#94A3B8", fontSize: 13 }}>
                  Create one above and it will appear here.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.4}>
                {meetings.map((m) => (
                  <Box
                    key={m._id}
                    sx={{
                      border: "1px solid rgba(51,65,85,0.75)",
                      borderRadius: 3,
                      p: 1.5,
                      background: "rgba(2,6,23,0.55)",
                      transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
                        borderColor: "rgba(96,165,250,0.85)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 15, color: "#E2E8F0" }}>
                          {m.title}
                        </Typography>
                        <Typography sx={{ color: "#94A3B8", fontSize: 12, mt: 0.2 }}>
                          {formatDateTime(m.startTime)} — {formatDateTime(m.endTime)}
                        </Typography>
                      </Box>
                      <Chip
                        label={`Code: ${m.meetingCode}`}
                        sx={{
                          background: "rgba(37,99,235,0.14)",
                          color: "#93C5FD",
                          border: "1px solid rgba(51,65,85,0.6)",
                          fontWeight: 900,
                        }}
                      />
                    </Box>
                    {m.attendees?.length > 0 && (
                      <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {m.attendees.map((email) => (
                          <Chip
                            key={email}
                            label={email}
                            size="small"
                            sx={{
                              background: "rgba(30,41,59,0.85)",
                              color: "white",
                              border: "1px solid rgba(51,65,85,0.8)",
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CalendarPage;

