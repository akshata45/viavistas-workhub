import { getDirectorStats } from "../services/dashboardService.js";

export const directorDashboard = async (req, res) => {
  try {
    const stats = await getDirectorStats();

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard data.",
    });
  }
};