import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FriendRequestProvider } from "./contexts/FriendRequestContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import ResetPasswordForm from "./components/Auth/ResetPasswordForm";
import { usePomodoroStore } from "./store/pomodoroStore";
import "./fonts.css";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Friends from "./components/Friends";
import Goal from "./components/Goal";
import Stats from "./components/Stats";
import About from "./components/About";
import TermsOfService from "./components/TermsOfService";
import UpdateNotification from "./components/UpdateNotification";

import Navbar from "./components/Navbar";
import TopNavigation from "./components/TopNavigation";
import Stopwatch from "./components/Stopwatch";
import FriendRequestNotification from "./components/FriendRequestNotification";

const App: React.FC = () => {
  const { checkAndResetDaily } = usePomodoroStore();

  // Automatic daily reset check
  useEffect(() => {
    // Check immediately on app startup
    checkAndResetDaily();

    // Set up interval to check every 5 minutes
    const dailyResetInterval = setInterval(() => {
      checkAndResetDaily();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(dailyResetInterval);
    };
  }, [checkAndResetDaily]);

  // Automatic layout detection based on window size
  useEffect(() => {
    const updateLayoutClasses = () => {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // Remove existing layout classes
      document.body.classList.remove("compact-layout", "very-compact");

      // Apply layout classes based on window dimensions
      // Since we have minimum window size of 900x650, adjust breakpoints accordingly
      if (windowHeight <= 700 || (windowWidth <= 950 && windowHeight <= 750)) {
        document.body.classList.add("very-compact");
      } else if (windowHeight <= 850 || windowWidth <= 1100) {
        document.body.classList.add("compact-layout");
      }
    };

    // Update on mount
    updateLayoutClasses();

    // Update on window resize
    window.addEventListener("resize", updateLayoutClasses);

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateLayoutClasses);
      document.body.classList.remove("compact-layout", "very-compact");
    };
  }, []);
  return (
    <AuthProvider>
      <FriendRequestProvider>
        <Router>
          <div className="background">
            <div className="app app-container">
              <Navbar />
              <FriendRequestNotification />
              <UpdateNotification />
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/reset-password" element={<ResetPasswordForm />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <div className="app-content">
                        <div className="stopwatch-container">
                          <Stopwatch />
                        </div>
                        <div className="main-content-wrapper">
                          <TopNavigation />
                          <div className="main-content-area">
                            <div className="tab-content">
                              <Routes>
                                <Route path="/friends" element={<Friends />} />
                                <Route path="/" element={<Goal />} />
                                <Route path="/stats" element={<Stats />} />
                                <Route path="/about" element={<About />} />
                              </Routes>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </div>
        </Router>
      </FriendRequestProvider>
    </AuthProvider>
  );
};

export default App;
