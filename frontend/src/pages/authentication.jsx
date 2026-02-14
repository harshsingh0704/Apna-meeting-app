import React, { useState, useContext } from "react";
import {
  Avatar,
  Button,
  TextField,
  Paper,
  Box,
  Typography,
  Tabs,
  Tab,
  Snackbar,
  CircularProgress
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { AuthContext } from "../contexts/AuthContext";
import { motion } from "framer-motion";

const Authentication = () => {
  const { handleLogin, handleRegister } = useContext(AuthContext);

  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      if (tab === 0) {
        await handleLogin(username, password);
      } else {
        const res = await handleRegister(name, username, password);
        setMessage(res);
        setOpen(true);
        setTab(0);
        setName("");
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Something went wrong";
      
      // Network/CORS errors ko better handle karo
      if (err?.code === "ERR_NETWORK" || err?.message?.includes("Network Error")) {
        setError("Backend server is not running. Please start the backend server.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1e1e2f, #0a0a0a)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: 400,
          p: 4,
          borderRadius: 4,
          background: "rgba(30,30,45,0.95)",
          color: "white"
        }}
      >
        {/* Animated Heading */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Box display="flex" flexDirection="column" alignItems="center">
            <Avatar sx={{ bgcolor: "#1a73e8", mb: 1 }}>
              <LockOutlinedIcon />
            </Avatar>

            <Typography variant="h5" fontWeight={700}>
              {tab === 0 ? "Welcome Back 👋" : "Create Your Account 🚀"}
            </Typography>

            <Typography
              variant="body2"
              sx={{ opacity: 0.7, mt: 1, textAlign: "center" }}
            >
              Secure video meetings inspired by Google Meet & Zoom
            </Typography>
          </Box>
        </motion.div>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          centered
          sx={{
            mt: 3,
            "& .MuiTab-root": { color: "#aaa" },
            "& .Mui-selected": { color: "#1a73e8" }
          }}
        >
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
        </Tabs>

        {/* Form */}
        <Box mt={3}>
          {tab === 1 && (
            <TextField
              fullWidth
              label="Full Name"
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              InputLabelProps={{ style: { color: "#aaa" } }}
              InputProps={{ style: { color: "white" } }}
            />
          )}

          <TextField
            fullWidth
            label="Username"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputLabelProps={{ style: { color: "#aaa" } }}
            InputProps={{ style: { color: "white" } }}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputLabelProps={{ style: { color: "#aaa" } }}
            InputProps={{ style: { color: "white" } }}
          />

          {error && (
            <Typography color="error" fontSize={14} mt={1}>
              {error}
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={handleAuth}
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.3,
              bgcolor: "#1a73e8",
              fontWeight: "bold",
              borderRadius: 3,
              textTransform: "none",
              ":hover": { bgcolor: "#1558c0" }
            }}
          >
            {loading ? (
              <CircularProgress size={22} sx={{ color: "white" }} />
            ) : tab === 0 ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
        onClose={() => setOpen(false)}
      />
    </Box>
  );
};

export default Authentication;
