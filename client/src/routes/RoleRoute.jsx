import { Navigate } from "react-router-dom";

function RoleRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem("workhubToken");
  const userData = localStorage.getItem("workhubUser");

  if (!token || !userData) {
    return <Navigate to="/" replace />;
  }

  let user;

  try {
    user = JSON.parse(userData);
  } catch {
    localStorage.removeItem("workhubToken");
    localStorage.removeItem("workhubUser");

    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RoleRoute;