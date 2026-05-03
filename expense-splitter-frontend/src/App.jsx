import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import { persistor } from "./app/store";
import { setHydrated, validateSession } from "./features/auth/authSlice";

import Login from "./pages/Auth/Login/Login";
import Register from "./pages/Auth/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import GroupsPage from "./pages/Groups/GroupsPage";
import Home from "./pages/Home/Home";
import ProtectedRoute from "./routes/ProtectedRoute";
import GroupPage from "./pages/Group/GroupPage";
import Profile from "./pages/Profile/Profile";
import UserProfile from "./pages/UserProfile/UserProfile";
import Settings from "./pages/Settings/Settings";
import FriendsPage from "./pages/Friends/FriendsPage";
import Layout from "./components/Layout/Layout";

import "./App.css";

function AppContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(validateSession());
    } else {
      dispatch(setHydrated());
    }
  }, [dispatch]);

  return (
    <div className="appContainer">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        gutter={16}
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(255, 255, 255, 0.95)",
            color: "#1f2937",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(226, 232, 240, 0.6)",
            borderRadius: "12px",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.5)",
            fontWeight: 500,
            fontSize: "14px",
          },
          success: {
            style: {
              background: "rgba(240, 253, 244, 0.95)",
              border: "1px solid rgba(134, 239, 172, 0.5)",
              color: "#166534",
              boxShadow:
                "0 25px 50px -12px rgba(22, 163, 74, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.5)",
            },
            iconTheme: {
              primary: "#16a34a",
              secondary: "#f0fdf4",
            },
          },
          error: {
            style: {
              background: "rgba(254, 242, 242, 0.95)",
              border: "1px solid rgba(252, 165, 165, 0.5)",
              color: "#991b1b",
              boxShadow:
                "0 25px 50px -12px rgba(220, 38, 38, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.5)",
            },
            iconTheme: {
              primary: "#dc2626",
              secondary: "#fef2f2",
            },
          },
        }}
      />

      {/* Dark Mode Toast Enhancements */}
      <style>{`
        .dark [role="status"] {
          background: rgba(30, 41, 59, 0.85) !important;
          color: #f9fafb !important;
          border-color: rgba(139, 92, 246, 0.3) !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 
                      inset 0 1px 1px rgba(139, 92, 246, 0.1) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
        }
      `}</style>

      {/* Routes */}
      <div className="routesContainer">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/group/:groupId" element={<GroupPage />} />
            <Route path="/profile/:username" element={<UserProfile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </BrowserRouter>
  );
}

export default App;
