import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import { IconButton, Divider, Chip, Box } from "@mui/material";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);

  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history || []);
      } catch (err) {
        console.log("History error:", err);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div style={{ padding: "20px" }}>
      <IconButton onClick={() => routeTo("/home")}>
        <HomeIcon />
      </IconButton>

      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        📜 Meeting History
      </Typography>

      {meetings.length !== 0 ? (
        meetings.map((e, i) => (
          <Card
            key={i}
            variant="outlined"
            sx={{
              mb: 2,
              borderRadius: "12px",
              background: "#0f172a",
              color: "white",
              border: "1px solid #1e293b",
            }}
          >
            <CardContent>
              <Typography sx={{ fontSize: 14, opacity: 0.8 }} gutterBottom>
                🔑 Code: <b>{e.meetingCode}</b>
              </Typography>

              <Typography sx={{ mb: 2, opacity: 0.8 }}>
                📅 Date: <b>{formatDate(e.date)}</b>
              </Typography>

              <Divider sx={{ mb: 2, borderColor: "#334155" }} />

              {/* ✅ Summary */}
              <Typography sx={{ fontSize: 16, fontWeight: "bold", mb: 1 }}>
                🧠 Summary:
              </Typography>

              <Typography sx={{ opacity: 0.85, mb: 2, whiteSpace: "pre-line" }}>
                {e.summary && e.summary.trim().length > 0
                  ? e.summary
                  : "❌ No summary saved yet"}
              </Typography>

              {/* ✅ Tasks */}
              <Typography sx={{ fontSize: 16, fontWeight: "bold", mb: 1 }}>
                ✅ Tasks:
              </Typography>

              {Array.isArray(e.actionItems) && e.actionItems.length > 0 ? (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {e.actionItems.map((task, idx) => (
                    <Chip
                      key={idx}
                      label={task}
                      sx={{
                        background: "#1e293b",
                        color: "white",
                        border: "1px solid #334155",
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography sx={{ opacity: 0.7 }}>
                  ❌ No tasks saved yet
                </Typography>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography sx={{ opacity: 0.7 }}>
          ❌ No meeting history found
        </Typography>
      )}
    </div>
  );
}
