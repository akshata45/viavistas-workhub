const API_URL = "http://localhost:5000/api";

const getToken = () => {
  return localStorage.getItem("workhubToken");
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Shared helper: sends the request and throws a readable error
const request = async (path, options = {}, fallbackMessage) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
};

export const getTeams = () =>
  request("/teams", {}, "Unable to fetch teams.");

export const createTeam = (teamData) =>
  request(
    "/teams",
    { method: "POST", body: JSON.stringify(teamData) },
    "Unable to create team."
  );

export const updateTeam = (teamId, teamData) =>
  request(
    `/teams/${teamId}`,
    { method: "PATCH", body: JSON.stringify(teamData) },
    "Unable to update team."
  );

export const deleteTeam = (teamId) =>
  request(
    `/teams/${teamId}`,
    { method: "DELETE" },
    "Unable to delete team."
  );

export const assignTeamLeader = (teamId, userId) =>
  request(
    `/teams/${teamId}/team-leader`,
    { method: "PATCH", body: JSON.stringify({ userId }) },
    "Unable to assign Team Leader."
  );