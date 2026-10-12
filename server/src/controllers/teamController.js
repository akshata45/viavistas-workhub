import {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  assignTeamLeader,
} from "../services/teamService.js";

export const listTeams = async (req, res) => {
  try {
    const teams = await getAllTeams();

    return res.json({
      success: true,
      teams,
    });
  } catch (error) {
    console.error("List teams error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch teams.",
    });
  }
};

export const getTeam = async (req, res) => {
  try {
    const team = await getTeamById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    return res.json({
      success: true,
      team,
    });
  } catch (error) {
    console.error("Get team error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch team.",
    });
  }
};

export const addTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Team name is required.",
      });
    }

    const team = await createTeam({
      name,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Team created successfully.",
      team,
    });
  } catch (error) {
    console.error("Create team error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create team.",
    });
  }
};

export const editTeam = async (req, res) => {
  try {
    const team = await updateTeam(req.params.id, req.body);

    return res.json({
      success: true,
      message: "Team updated successfully.",
      team,
    });
  } catch (error) {
    console.error("Update team error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update team.",
    });
  }
};

export const removeTeam = async (req, res) => {
  try {
    await deleteTeam(req.params.id);

    return res.json({
      success: true,
      message: "Team deleted successfully.",
    });
  } catch (error) {
    console.error("Delete team error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to delete team.",
    });
  }
};

export const setTeamLeader = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Team Leader user ID is required.",
      });
    }

    const team = await assignTeamLeader(req.params.id, userId);

    return res.json({
      success: true,
      message: "Team Leader assigned successfully.",
      team,
    });
  } catch (error) {
    console.error("Assign team leader error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to assign Team Leader.",
    });
  }
};