import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
} from "../services/userService.js";

export const listUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("List users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users.",
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user.",
    });
  }
};

export const addUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      teamId,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const user = await createUser({
      name,
      email,
      password,
      role,
      teamId,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create user.",
    });
  }
};

export const editUser = async (req, res) => {
  try {
    const user = await updateUser(
      req.params.id,
      req.body
    );

    return res.json({
      success: true,
      message: "User updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(400).json({
      success: false,
            message: error.message || "Unable to update user.",
    });
  }
};

export const disableUser = async (req, res) => {
  try {
    const user = await deactivateUser(
      req.params.id
    );

    return res.json({
      success: true,
      message: "User deactivated successfully.",
      user,
    });
  } catch (error) {
    console.error("Deactivate user error:", error);

    return res.status(400).json({
      success: false,
            message: error.message || "Unable to deactivate user.",
    });
  }
};