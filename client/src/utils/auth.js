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

export const logout = () => {
  localStorage.removeItem("workhubToken");
  localStorage.removeItem("workhubUser");
};