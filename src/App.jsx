import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import Login from "./Pages/Login";
import AdminSignup from "./Pages/AdminSignup";
import StudentSignup from "./Pages/StudentSignup";
import AdminDashboard from "./Pages/AdminDashboard";
import StudentProfile from "./Pages/StudentProfile";
import Dashboard from "./AppDashboardWrapper"; // keep existing dashboard wrapper if present

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireRole({ role, children }) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile.role !== role) {
    // Redirect to appropriate page for their role
    if (profile.role === "admin") return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin-signup" element={<AdminSignup />} />
      <Route path="/student-signup" element={<StudentSignup />} />

      <Route
        path="/admin-dashboard"
        element={
          <RequireAuth>
            <RequireRole role="admin">
              <AdminDashboard />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <RequireRole role="student">
              <Dashboard />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <StudentProfile />
          </RequireAuth>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;