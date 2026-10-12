import { getTeamForLeader } from "../services/tlService.js";

export const myTeam = async (req, res) => {
  try {
    const team = await getTeamForLeader(req.user);

    return res.json({
      success: true,
      team,
    });
  } catch (error) {
    console.error("My team error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your team.",
    });
  }
};