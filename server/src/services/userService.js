import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

const VALID_ROLES = ["DIRECTOR", "TL", "EMPLOYEE"];

// Get all users
export const getAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profilePhoto: true,
      isActive: true,
      teamId: true,
      createdAt: true,
      updatedAt: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

// Get one user
export const getUserById = async (id) => {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID.");
  }

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profilePhoto: true,
      isActive: true,
      teamId: true,
      createdAt: true,
      updatedAt: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      ledTeam: true,
    },
  });
};

// Create a user
export const createUser = async ({
  name,
  email,
  password,
  role = "EMPLOYEE",
  teamId,
}) => {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");
  const cleanRole = String(role || "EMPLOYEE").toUpperCase();

  if (!cleanName || !cleanEmail || !cleanPassword) {
    throw new Error("Name, email and password are required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (cleanPassword.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }

  if (!VALID_ROLES.includes(cleanRole)) {
    throw new Error("Invalid role selected.");
  }

  // Check whether the email is already registered
  const existingUser = await prisma.user.findUnique({
    where: {
      email: cleanEmail,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  // Validate the optional team assignment
  let parsedTeamId = null;

  if (teamId !== undefined && teamId !== null && teamId !== "") {
    parsedTeamId = Number(teamId);

    if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
      throw new Error("Please select a valid team.");
    }

    const team = await prisma.team.findUnique({
      where: {
        id: parsedTeamId,
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      throw new Error("The selected team does not exist. Create the team first.");
    }
  }

  const hashedPassword = await bcrypt.hash(cleanPassword, 12);

  try {
    // Use the scalar teamId field defined in your Prisma User model.
    // Do not use both teamId and team.connect in the same create operation.
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: cleanRole,
        isActive: true,
        ...(parsedTeamId !== null && {
          teamId: parsedTeamId,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        isActive: true,
        teamId: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    // Handle duplicate-email conflicts, including simultaneous requests.
    if (error.code === "P2002") {
      throw new Error("A user with this email already exists.");
    }

    // Handle a team being removed between validation and creation.
    if (error.code === "P2003") {
      throw new Error("The selected team is invalid. Please select another team.");
    }

    throw error;
  }
};

// Update a user
export const updateUser = async (
  id,
  {
    name,
    email,
    role,
    teamId,
    isActive,
    profilePhoto,
  }
) => {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID.");
  }

  const data = {};

  if (name !== undefined) {
    const cleanName = String(name).trim();

    if (!cleanName) {
      throw new Error("Name cannot be empty.");
    }

    data.name = cleanName;
  }

  if (email !== undefined) {
    const cleanEmail = String(email).trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    data.email = cleanEmail;
  }

  if (role !== undefined) {
    const cleanRole = String(role).toUpperCase();

    if (!VALID_ROLES.includes(cleanRole)) {
      throw new Error("Invalid role selected.");
    }

    data.role = cleanRole;
  }

  if (teamId !== undefined) {
    if (teamId === null || teamId === "") {
      data.teamId = null;
    } else {
      const parsedTeamId = Number(teamId);

      if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
        throw new Error("Please select a valid team.");
      }

      const team = await prisma.team.findUnique({
        where: {
          id: parsedTeamId,
        },
        select: {
          id: true,
        },
      });

      if (!team) {
        throw new Error("The selected team does not exist.");
      }

      data.teamId = parsedTeamId;
    }
  }

  if (isActive !== undefined) {
    data.isActive = Boolean(isActive);
  }

  if (profilePhoto !== undefined) {
    data.profilePhoto = profilePhoto;
  }

  try {
    return await prisma.user.update({
      where: {
        id: userId,
      },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        isActive: true,
        teamId: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new Error("A user with this email already exists.");
    }

    if (error.code === "P2025") {
      throw new Error("User not found.");
    }

    throw error;
  }
};

// Deactivate a user without deleting their records
export const deactivateUser = async (id) => {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID.");
  }

  try {
    return await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("User not found.");
    }

    throw error;
  }
};
