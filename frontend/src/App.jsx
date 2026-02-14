import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import HomeComponent from "./pages/home";
import History from "./pages/history";
import VideoMeetComponent from "./pages/VideoMeet";
import Meeting from "./pages/Meeting";
import { AuthProvider } from "./contexts/AuthContext";
import TaskManager from "./pages/TaskManager";
import Workspace from "./pages/Workspace";
import CalendarPage from "./pages/Calendar";
import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Authentication />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomeComponent />} />
            <Route path="/history" element={<History />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/workspaces" element={<Workspace />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/meeting" element={<Meeting />} />
          </Route>

          {/* VIDEO CALL */}
          <Route path="/meet/:url" element={<VideoMeetComponent />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

