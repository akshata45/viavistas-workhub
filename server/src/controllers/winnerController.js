import { listWinners, confirmWinner } from "../services/winnerService.js";

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

export const winners = async (req, res) => {
  try {
    const data = await listWinners();

    return res.json({ success: true, winners: data });
  } catch (error) {
    return sendError(res, error, "Unable to load the winners.");
  }
};

export const chooseWinner = async (req, res) => {
  try {
    const winner = await confirmWinner(req.user, req.body);

    return res.status(201).json({
      success: true,
      message: "Employee of the Month saved.",
      winner,
    });
  } catch (error) {
    return sendError(res, error, "Unable to save the winner.");
  }
};