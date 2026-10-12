import { Navigate } from "react-router-dom";

function ProtectedRoute({
  children,
  allowedRoles = [],
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