const API_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("workhubToken");

// Shared helper: sends the request and throws a readable error
const request = async (path, options = {}, fallbackMessage) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
};

const withMonth = (path, month) =>
  month ? `${path}?month=${encodeURIComponent(month)}` : path;

// month looks like "2026-10"; leave it empty for the current month
export const getLeaderboard = (month) =>
  request(
    withMonth("/points/leaderboard", month),
    {},
    "Unable to load the leaderboard."
  );

export const getMyPoints = (month) =>
  request(withMonth("/points/me", month), {}, "Unable to load your points.");

// Director only
export const awardBonus = (bonusData) =>
  request(
    "/points/bonus",
    { method: "POST", body: JSON.stringify(bonusData) },
    "Unable to record points."
  );

// Employee of the Month: everyone can see the winners
export const getWinners = () =>
  request("/points/winners", {}, "Unable to load the winners.");

// Director only: { month: "2026-10", userId, note }
export const confirmWinner = (winnerData) =>
  request(
    "/points/winner",
    { method: "POST", body: JSON.stringify(winnerData) },
    "Unable to save the winner."
  );