import React, { useMemo, useState, useEffect } from "react";
import server from "../environment";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

const Workspace = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState("");

  const apiBase = `${server}/api/v1/workspaces`;

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiBase, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
        // keep selection fresh
        if (selectedWorkspace?._id) {
          const next = data.find((w) => w._id === selectedWorkspace._id);
          setSelectedWorkspace(next || null);
        }
      } else {
        setError('Failed to fetch workspaces.');
      }
    } catch (err) {
      setError('An error occurred while fetching workspaces.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) {
        setError('Workspace name cannot be empty.');
        return;
    }
    setError('');
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newWorkspaceName }),
      });

      if (response.ok) {
        const newWorkspace = await response.json();
        setWorkspaces([...workspaces, newWorkspace]);
        setNewWorkspaceName('');
        setSelectedWorkspace(newWorkspace);
      } else {
        setError('Failed to create workspace.');
      }
    } catch (err) {
      setError('An error occurred while creating the workspace.');
    }
  };

  const filteredWorkspaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(workspaces) ? workspaces : [];
    if (!q) return list;
    return list.filter((w) => String(w?.name || "").toLowerCase().includes(q));
  }, [workspaces, query]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 10% 10%, rgba(37,99,235,0.18) 0%, rgba(2,6,23,1) 55%)",
        py: 3,
      }}
    >
      <Container maxWidth="lg">
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
              🧩 Workspaces
            </Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: 13 }}>
              Create, search and manage your workspace members • Total:{" "}
              <b style={{ color: "#E2E8F0" }}>{workspaces.length}</b>
            </Typography>
          </Box>

          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspaces…"
            size="small"
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, color: "#94A3B8", display: "flex" }}>
                  <SearchIcon fontSize="small" />
                </Box>
              ),
            }}
            sx={{
              width: { xs: 180, sm: 280, md: 340 },
              "& .MuiInputBase-root": {
                backgroundColor: "rgba(15,23,42,0.7)",
                borderRadius: "12px",
                color: "#E2E8F0",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(51,65,85,0.8)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(96,165,250,0.8)",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "#94A3B8",
                opacity: 1,
              },
            }}
          />
        </Box>

        {/* Create Workspace */}
        <Card
          variant="outlined"
          sx={{
            mb: 2.5,
            borderRadius: 4,
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))",
            color: "white",
            border: "1px solid rgba(51,65,85,0.8)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: 4,
              background:
                "linear-gradient(90deg, rgba(37,99,235,1), rgba(96,165,250,1))",
            }}
          />
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography sx={{ fontSize: 16, fontWeight: 900, mb: 0.5 }}>
              Create new workspace
            </Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: 13, mb: 2 }}>
              Give it a clear name — you can add members later.
            </Typography>

            <Box
              component="form"
              onSubmit={handleCreateWorkspace}
              sx={{ display: "flex", gap: 1.2, flexWrap: "wrap" }}
            >
              <TextField
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g. Product Team, College Group…"
                size="small"
                fullWidth
                sx={{
                  flex: "1 1 320px",
                  "& .MuiInputBase-root": {
                    backgroundColor: "rgba(2,6,23,0.55)",
                    borderRadius: "12px",
                    color: "#E2E8F0",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(51,65,85,0.8)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(96,165,250,0.8)",
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "#94A3B8",
                    opacity: 1,
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newWorkspaceName.trim()}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 900,
                  textTransform: "none",
                  minWidth: 170,
                  background:
                    "linear-gradient(90deg, rgba(37,99,235,1), rgba(96,165,250,1))",
                  boxShadow: "0 10px 20px rgba(37,99,235,0.25)",
                  "&:hover": {
                    boxShadow: "0 14px 30px rgba(37,99,235,0.35)",
                  },
                }}
              >
                Create
              </Button>
            </Box>

            {error && (
              <Box
                sx={{
                  mt: 2,
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
          </CardContent>
        </Card>

        {/* Main layout */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" },
            gap: 2.5,
            alignItems: "start",
          }}
        >
          {/* Workspace list */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 4,
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))",
              color: "white",
              border: "1px solid rgba(51,65,85,0.8)",
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 900 }}>
                  My workspaces
                </Typography>
                <Chip
                  size="small"
                  label={`${filteredWorkspaces.length} shown`}
                  sx={{
                    background: "rgba(37,99,235,0.14)",
                    color: "#93C5FD",
                    border: "1px solid rgba(51,65,85,0.6)",
                  }}
                />
              </Box>

              <Divider sx={{ my: 1.8, borderColor: "rgba(51,65,85,0.8)" }} />

              {loading ? (
                <Box sx={{ display: "grid", gap: 1.2 }}>
                  {[1, 2, 3].map((k) => (
                    <Box
                      key={k}
                      sx={{
                        border: "1px solid rgba(51,65,85,0.65)",
                        borderRadius: 3,
                        p: 1.5,
                        background: "rgba(2,6,23,0.55)",
                      }}
                    >
                      <Skeleton variant="text" width="55%" sx={{ bgcolor: "rgba(148,163,184,0.18)" }} />
                      <Skeleton variant="text" width="30%" sx={{ bgcolor: "rgba(148,163,184,0.12)" }} />
                    </Box>
                  ))}
                </Box>
              ) : filteredWorkspaces.length > 0 ? (
                <Box sx={{ display: "grid", gap: 1.2 }}>
                  {filteredWorkspaces.map((ws) => {
                    const active = selectedWorkspace?._id === ws._id;
                    return (
                      <Box
                        key={ws._id}
                        onClick={() => setSelectedWorkspace(ws)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setSelectedWorkspace(ws);
                        }}
                        sx={{
                          cursor: "pointer",
                          border: "1px solid rgba(51,65,85,0.75)",
                          borderRadius: 3,
                          p: 1.5,
                          background: active
                            ? "linear-gradient(90deg, rgba(37,99,235,0.20), rgba(2,6,23,0.55))"
                            : "rgba(2,6,23,0.55)",
                          transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
                            borderColor: "rgba(96,165,250,0.85)",
                          },
                        }}
                      >
                        <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
                          {ws.name}
                        </Typography>
                        <Typography sx={{ color: "#94A3B8", fontSize: 12, mt: 0.2 }}>
                          Owner: {ws?.owner?.name || "—"} • Members:{" "}
                          {Array.isArray(ws?.members) ? ws.members.length : 0}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 1,
                    textAlign: "center",
                    border: "1px dashed rgba(51,65,85,0.8)",
                    background: "rgba(2,6,23,0.45)",
                    borderRadius: 4,
                    p: 3,
                  }}
                >
                  <Typography sx={{ fontSize: 18, fontWeight: 900, color: "white" }}>
                    No workspaces yet
                  </Typography>
                  <Typography sx={{ mt: 1, color: "#94A3B8", fontSize: 13 }}>
                    Create your first workspace from above.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Details panel */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 4,
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))",
              color: "white",
              border: "1px solid rgba(51,65,85,0.8)",
              overflow: "hidden",
              position: { md: "sticky" },
              top: { md: 100 },
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography sx={{ fontSize: 16, fontWeight: 900, mb: 0.5 }}>
                Workspace details
              </Typography>
              <Typography sx={{ color: "#94A3B8", fontSize: 13, mb: 2 }}>
                Select a workspace on the left to view members.
              </Typography>

              <Divider sx={{ my: 1.8, borderColor: "rgba(51,65,85,0.8)" }} />

              {selectedWorkspace ? (
                <>
                  <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
                    {selectedWorkspace.name}
                  </Typography>
                  <Typography sx={{ mt: 0.5, color: "#94A3B8", fontSize: 13 }}>
                    Owner: <b style={{ color: "#E2E8F0" }}>{selectedWorkspace?.owner?.name || "—"}</b>
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 900, mb: 1 }}>
                      Members
                    </Typography>
                    {Array.isArray(selectedWorkspace?.members) &&
                    selectedWorkspace.members.length > 0 ? (
                      <Box sx={{ display: "grid", gap: 1 }}>
                        {selectedWorkspace.members.map((member, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              border: "1px solid rgba(51,65,85,0.65)",
                              background: "rgba(2,6,23,0.55)",
                              borderRadius: 3,
                              p: 1.2,
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 1.2,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography sx={{ color: "#E2E8F0", fontWeight: 800 }}>
                              {member?.user?.name || "Unknown"}
                            </Typography>
                            <Chip
                              size="small"
                              label={member?.role || "member"}
                              sx={{
                                background: "rgba(37,99,235,0.14)",
                                color: "#93C5FD",
                                border: "1px solid rgba(51,65,85,0.6)",
                                fontWeight: 800,
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: "#CBD5E1", opacity: 0.8 }}>
                        No members found.
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
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
                    Nothing selected
                  </Typography>
                  <Typography sx={{ mt: 1, color: "#94A3B8", fontSize: 13 }}>
                    Click a workspace card to see its members and owner.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default Workspace;
