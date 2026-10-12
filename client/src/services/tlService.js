const API_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("workhubToken");

// Team Leader's own team and its active members
export const getMyTeam = async () => {
  const response = await fetch(`${API_URL}/tl/team`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load your team.");
  }

  return data;
};