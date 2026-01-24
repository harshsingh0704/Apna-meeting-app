import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import HomeComponent from "./pages/home";
import History from "./pages/history";
import VideoMeetComponent from "./pages/VideoMeet";
import Meeting from "./pages/Meeting";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/home" element={<HomeComponent />} />
          <Route path="/history" element={<History />} />

          {/* 🔥 AI CHAT PAGE */}
          <Route path="/meeting" element={<Meeting />} />

          {/* VIDEO CALL */}
          <Route path="/:url" element={<VideoMeetComponent />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
