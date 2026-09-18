import { Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login";
import DirectorDashboard from "../pages/director/DirectorDashboard";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>

      {/* Login */}
      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/login"
        element={<Login />}
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

    </Routes>
  );
}

export default AppRoutes;