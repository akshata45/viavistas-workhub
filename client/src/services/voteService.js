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

// Employee: my Team Leader and my rating for this month
export const getMyVote = () =>
  request("/votes/my-vote", {}, "Unable to load your rating.");

// Employee: { rating: 1-5, comment }
export const submitVote = (voteData) =>
  request(
    "/votes",
    { method: "PUT", body: JSON.stringify(voteData) },
    "Unable to save your rating."
  );

// Team Leader: my own score
export const getMyScore = (month) =>
  request(withMonth("/votes/my-score", month), {}, "Unable to load your score.");

// Director: every Team Leader's score
export const getLeaderScores = (month) =>
  request(
    withMonth("/votes/leaders", month),
    {},
    "Unable to load the Team Leader scores."
  );