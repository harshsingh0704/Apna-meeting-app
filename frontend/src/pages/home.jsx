// @ts-nocheck
import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  TextField,
  IconButton,
  Stack,
  Container,
  Paper,
  CssBaseline
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import { AuthContext } from "../contexts/AuthContext";

/* 🔥 Text animation */
const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const { addToUserHistory } = useContext(AuthContext);

  /* 🔥 Generate meeting code */
  const generateMeetingCode = () => {
    const code = Math.random().toString(36).substring(2, 8);
    setMeetingCode(code);
  };

  const handleJoinVideoCall = async () => {
    if (!meetingCode) return;
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  /* 🎨 Theme */
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#1a73e8"
      },
      background: {
        default: darkMode ? "#0f172a" : "#f5f7fb",
        paper: darkMode ? "#020617" : "#ffffff"
      }
    }
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ===== NAVBAR ===== */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <VideoCallIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight="bold">
              Apna Video Call
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            <IconButton onClick={() => navigate("/history")}>
              <RestoreIcon />
            </IconButton>

            <Button
              startIcon={<LogoutIcon />}
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/auth");
              }}
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ===== MAIN SECTION ===== */}
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={8}
          alignItems="center"
          justifyContent="space-between"
        >
          {/* LEFT */}
          <Box flex={1}>
            <Typography
              variant="h3"
              fontWeight="bold"
              sx={{
                animation: `${fadeUp} 0.8s ease`
              }}
            >
              Meet smarter.  
              <br />
              Connect faster.
            </Typography>

            <Typography
              sx={{
                mt: 2,
                mb: 4,
                fontSize: "1.1rem",
                color: "text.secondary",
                animation: `${fadeUp} 1.1s ease`
              }}
            >
              Crystal-clear video meetings.  
              Secure. Simple. Built for the modern world.
            </Typography>

            <Paper
              elevation={6}
              sx={{
                p: 3,
                maxWidth: 440,
                borderRadius: 3,
                animation: `${fadeUp} 1.4s ease`
              }}
            >
              <Stack spacing={2}>
                <TextField
                  label="Meeting Code"
                  fullWidth
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                />

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleJoinVideoCall}
                    sx={{ py: 1.2 }}
                  >
                    Join Meeting
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={generateMeetingCode}
                    fullWidth
                  >
                    New Meeting
                  </Button>
                </Stack>

                <Typography
                  variant="caption"
                  align="center"
                  color="text.secondary"
                >
                  End-to-end encrypted • WebRTC powered
                </Typography>
              </Stack>
            </Paper>
          </Box>

          {/* RIGHT */}
          <Box
            flex={1}
            display="flex"
            justifyContent="center"
            sx={{
              animation: `${fadeUp} 1.6s ease`
            }}
          >
            <img
              src="/logo3.png"
              alt="Video Call"
              style={{ maxWidth: "100%" }}
            />
          </Box>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}

export default withAuth(HomeComponent);
