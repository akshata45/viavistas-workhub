import {
  getMyVote,
  submitVote,
  getMyScore,
  getLeaderScores,
} from "../services/voteService.js";

// Errors we created on purpose show their message.
// Anything unexpected is logged and shown as a generic 500.
const sendError = (res, error, fallbackMessage) => {
  if (error.status) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
    });
  }

  console.error(fallbackMessage, error);

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

export const myVote = async (req, res) => {
  try {
    const data = await getMyVote(req.user);

    return res.json({ success: true, ...data });
  } catch (error) {
    return sendError(res, error, "Unable to load your rating.");
  }
};

export const castVote = async (req, res) => {
  try {
    const data = await submitVote(req.user, req.body);

    return res.json({
      success: true,
      message: "Your rating was saved.",
      ...data,
    });
  } catch (error) {
    return sendError(res, error, "Unable to save your rating.");
  }
};

export const myScore = async (req, res) => {
  try {
    const data = await getMyScore(req.user, req.query.month);

    return res.json({ success: true, ...data });
  } catch (error) {
    return sendError(res, error, "Unable to load your score.");
  }
};

export const leaderScores = async (req, res) => {
  try {
    const data = await getLeaderScores(req.query.month);

    return res.json({ success: true, ...data });
  } catch (error) {
    return sendError(res, error, "Unable to load the Team Leader scores.");
  }
};