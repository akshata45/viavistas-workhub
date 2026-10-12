import { Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login";
import DirectorDashboard from "../pages/director/DirectorDashboard";
import AllEmployees from "../pages/director/AllEmployees";
import Teams from "../pages/director/Teams";
import AllTasks from "../pages/director/AllTasks";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import TLDashboard from "../pages/tl/TLDashboard";
import ComingSoon from "../pages/common/ComingSoon";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

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

      {/* Employee and Team Leader: their own assigned work */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE", "TL"]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      {/* Team Leader: team management */}
      <Route
        path="/tl"
        element={
          <ProtectedRoute allowedRoles={["TL"]}>
            <TLDashboard />
          </ProtectedRoute>
        }
      />

      {/* Not built yet: placeholder instead of a blank screen */}
      <Route
        path="/director/performance"
        element={
          <ProtectedRoute allowedRoles={["DIRECTOR"]}>
            <ComingSoon
              title="Performance"
              message="Performance tracking will arrive after tasks and points."
            />
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