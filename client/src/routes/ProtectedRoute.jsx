import { Navigate } from "react-router-dom";

// allowedRoles          which roles may open this page (empty = any logged-in person)
// allowTemporaryPassword true only for the change-password page
function ProtectedRoute({
  children,
  allowedRoles = [],
  allowTemporaryPassword = false,
}) {
  const token =
    localStorage.getItem("workhubToken");

  const userData =
    localStorage.getItem("workhubUser");

  if (!token || !userData) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  let user;

  try {
    user = JSON.parse(userData);
  } catch {
    localStorage.removeItem(
      "workhubToken"
    );

    localStorage.removeItem(
      "workhubUser"
    );

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // Someone with a temporary password can only choose a new one
  if (user.mustChangePassword && !allowTemporaryPassword) {
    return (
      <Navigate
        to="/change-password"
        replace
      />
    );
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    if (user.role === "DIRECTOR") {
      return (
        <Navigate
          to="/director"
          replace
        />
      );
    }

    if (user.role === "TL") {
      return (
        <Navigate
          to="/tl"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;