
import { getAllUsers } from "../services/userService.js";

export const getDirectorDashboard = async (req, res) => {
  try {
    const users = await getAllUsers();

    const employees = users.filter(
      (user) => user.role !== "DIRECTOR"
    );

    return res.status(200).json({
      success: true,
      stats: {
        employees: employees.length,
        pendingWork: 0,
        completed: 0,
      },
    });
  } catch (error) {
    console.error("Director dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard data.",
    });
  }
};
