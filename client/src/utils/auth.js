export const getToken = () => {
  return localStorage.getItem("workhubToken");
};

export const getUser = () => {
  const user = localStorage.getItem("workhubUser");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isLoggedIn = () => {
  return !!getToken();
};

// Saves a new login (used after the password is changed)
export const saveSession = (token, user) => {
  localStorage.setItem("workhubToken", token);
  localStorage.setItem("workhubUser", JSON.stringify(user));
};

// The first page each role sees
export const homePathFor = (role) => {
  if (role === "DIRECTOR") return "/director";
  if (role === "TL") return "/tl";

  return "/dashboard";
};

export const logout = () => {
  localStorage.removeItem("workhubToken");
  localStorage.removeItem("workhubUser");
};