import { Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login";
import ChangePassword from "../pages/auth/ChangePassword";
import DirectorDashboard from "../pages/director/DirectorDashboard";
import AllEmployees from "../pages/director/AllEmployees";
import Teams from "../pages/director/Teams";
import AllTasks from "../pages/director/AllTasks";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import TLDashboard from "../pages/tl/TLDashboard";
import ComingSoon from "../pages/common/ComingSoon";
import Leaderboard from "../pages/common/Leaderboard";
import MyPoints from "../pages/common/MyPoints";
import LeaderScores from "../pages/director/LeaderScores";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* Any logged-in person, including someone with a temporary password */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute allowTemporaryPassword>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Director Dashboard */}
      <Route
        path="/director"
        element={
          <ProtectedRoute>
            <DirectorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/director/employees"
        element={
          <ProtectedRoute allowedRoles={["DIRECTOR"]}>
            <AllEmployees />
          </ProtectedRoute>
        }
      />

      <Route
        path="/director/teams"
        element={
          <ProtectedRoute allowedRoles={["DIRECTOR"]}>
            <Teams />
          </ProtectedRoute>
        }
      />

      <Route
        path="/director/tasks"
        element={
          <ProtectedRoute allowedRoles={["DIRECTOR"]}>
            <AllTasks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/director/leaders"
        element={
          <ProtectedRoute allowedRoles={["DIRECTOR"]}>
            <LeaderScores />
          </ProtectedRoute>
        }
      />

      {/* Employee and Team Leader: their own assigned work */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE", "TL"]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tl"
        element={
          <ProtectedRoute allowedRoles={["TL"]}>
            <TLDashboard />
          </ProtectedRoute>
        }
      />

      {/* Points: leaderboard for everyone, history for staff */}
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/points"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE", "TL"]}>
            <MyPoints />
          </ProtectedRoute>
        }
      />

      {/* The Director's Performance card opens the leaderboard */}
      <Route
        path="/director/performance"
        element={
          <ProtectedRoute allowedRoles={["DIRECTOR"]}>
            <Leaderboard />
          </ProtectedRoute>
        }
      />

      {/* Any other address */}
      <Route
        path="*"
        element={
          <ComingSoon
            title="Page not found"
            message="This address does not exist."
          />
        }
      />
    </Routes>
  );
}

export default AppRoutes;