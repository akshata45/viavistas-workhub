const API_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("workhubToken");

// { currentPassword, newPassword } -> { token, user }
export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to change your password.");
  }

  return data;
};