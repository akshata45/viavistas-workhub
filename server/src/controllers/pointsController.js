import {
  getLeaderboard,
  getMyPoints,
  awardBonus,
} from "../services/pointsService.js";

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

export const leaderboard = async (req, res) => {
  try {
    const data = await getLeaderboard(req.query.month);

    return res.json({ success: true, ...data });
  } catch (error) {
    return sendError(res, error, "Unable to load the leaderboard.");
  }
};

export const myPoints = async (req, res) => {
  try {
    const data = await getMyPoints(req.user, req.query.month);

    return res.json({ success: true, ...data });
  } catch (error) {
    return sendError(res, error, "Unable to load your points.");
  }
};

export const giveBonus = async (req, res) => {
  try {
    const transaction = await awardBonus(req.user, req.body);

    return res.status(201).json({
      success: true,
      message: "Points recorded.",
      transaction,
    });
  } catch (error) {
    return sendError(res, error, "Unable to record points.");
  }
};