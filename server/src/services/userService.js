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
      managedTeam: { select: { id: true, name: true } },
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
        mustChangePassword: true,
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

// Fields returned after an update (never includes the password)
const updatedUserSelect = {
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
};

// Update a user
export const updateUser = async (
  id,
  {
    name,
    email,
    password,
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

  // Load the current user, and the team they lead (if any)
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      managedTeam: {
        select: { id: true, name: true },
      },
    },
  });

  if (!existing) {
    throw new Error("User not found.");
  }

  const isDirector = existing.role === "DIRECTOR";
  const ledTeam = existing.managedTeam;

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

  // Optional password reset by the Director
  if (password !== undefined && password !== null && password !== "") {
    const cleanPassword = String(password);

    if (cleanPassword.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    data.password = await bcrypt.hash(cleanPassword, 12);

    // A password set by the Director is temporary: the person must choose
    // their own, and any older login sessions stop working.
    data.mustChangePassword = true;
    data.passwordChangedAt = new Date();
  }

  if (role !== undefined) {
    const cleanRole = String(role).toUpperCase();

    if (!VALID_ROLES.includes(cleanRole)) {
      throw new Error("Invalid role selected.");
    }

    if (cleanRole !== existing.role) {
      if (isDirector) {
        throw new Error("The Director's role cannot be changed.");
      }

      if (cleanRole === "DIRECTOR") {
        throw new Error("Employees cannot be promoted to Director here.");
      }

      if (ledTeam) {
        throw new Error(
          `${existing.name} leads "${ledTeam.name}". Choose a different leader for that team on the Teams page first.`
        );
      }

      data.role = cleanRole;
    }
  }

  let newTeamId = existing.teamId;
  let teamChanged = false;

  if (teamId !== undefined) {
    let parsedTeamId = null;

    if (teamId !== null && teamId !== "") {
      parsedTeamId = Number(teamId);

      if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
        throw new Error("Please select a valid team.");
      }

      const team = await prisma.team.findUnique({
        where: { id: parsedTeamId },
        select: { id: true },
      });

      if (!team) {
        throw new Error("The selected team does not exist.");
      }
    }

    if (parsedTeamId !== existing.teamId) {
      if (isDirector) {
        throw new Error("The Director cannot be placed in a team.");
      }

      if (ledTeam) {
        throw new Error(
          `${existing.name} leads "${ledTeam.name}". Choose a different leader for that team on the Teams page before moving them.`
        );
      }

      data.teamId = parsedTeamId;
      newTeamId = parsedTeamId;
      teamChanged = true;
    }
  }

  let clearLeadership = false;

  if (isActive !== undefined) {
    const active = Boolean(isActive);

    if (!active && isDirector) {
      throw new Error("The Director account cannot be deactivated.");
    }

    // A deactivated Team Leader must not stay as their team's leader
    if (!active && ledTeam) {
      clearLeadership = true;
    }

    data.isActive = active;
  }

  if (profilePhoto !== undefined) {
    data.profilePhoto = profilePhoto;
  }

  // All changes below succeed together or fail together
  const operations = [
    prisma.user.update({
      where: { id: userId },
      data,
      select: updatedUserSelect,
    }),
  ];

  // Unfinished work follows the employee to their new team,
  // so the new Team Leader can review it. Approved work stays
  // with the old team as history.
  if (teamChanged) {
    operations.push(
      prisma.task.updateMany({
        where: {
          assignedToId: userId,
          status: { not: "APPROVED" },
        },
        data: { teamId: newTeamId },
      })
    );
  }

  if (clearLeadership) {
    operations.push(
      prisma.team.update({
        where: { id: ledTeam.id },
        data: { teamLeaderId: null },
      })
    );
  }

  try {
    const results = await prisma.$transaction(operations);

    return results[0];
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
  return updateUser(id, { isActive: false });
};