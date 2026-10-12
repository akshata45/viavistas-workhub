import prisma from "../config/prisma.js";

export const getAllTeams = async () => {
  return prisma.team.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      teamLeader: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });
};

export const getTeamById = async (id) => {
  return prisma.team.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      teamLeader: true,
      members: true,
    },
  });
};

export const createTeam = async ({ name, description }) => {
  const cleanName = name.trim();

  const existing = await prisma.team.findUnique({
    where: { name: cleanName },
  });

  if (existing) {
    throw new Error("A team with this name already exists.");
  }

  return prisma.team.create({
    data: {
      name: cleanName,
      description: description?.trim() || null,
    },
  });
};

export const updateTeam = async (id, { name, description, isActive }) => {
  const teamId = Number(id);
  const data = {};

  if (name !== undefined) {
    const cleanName = name.trim();

    if (!cleanName) {
      throw new Error("Team name cannot be empty.");
    }

    const existing = await prisma.team.findFirst({
      where: {
        name: cleanName,
        NOT: { id: teamId },
      },
    });

    if (existing) {
      throw new Error("A team with this name already exists.");
    }

    data.name = cleanName;
  }

  if (description !== undefined) {
    data.description = description?.trim() || null;
  }

  if (isActive !== undefined) {
    data.isActive = isActive;
  }

  return prisma.team.update({
    where: { id: teamId },
    data,
    include: { teamLeader: true, members: true },
  });
};

export const deleteTeam = async (id) => {
  const teamId = Number(id);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    throw new Error("Team not found.");
  }

  // Members become unassigned, then the team is deleted.
  // Both steps succeed together or fail together.
  await prisma.$transaction([
    prisma.user.updateMany({
      where: { teamId },
      data: { teamId: null },
    }),
    prisma.team.delete({
      where: { id: teamId },
    }),
  ]);

  return team;
};

export const assignTeamLeader = async (teamId, userId) => {
  const team = await prisma.team.findUnique({
    where: { id: Number(teamId) },
  });

  if (!team) {
    throw new Error("Team not found.");
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.role !== "TL") {
    throw new Error("Only users with TL role can be assigned as Team Leader.");
  }

  if (!user.isActive) {
    throw new Error("Inactive users cannot be Team Leaders.");
  }

  const alreadyLeading = await prisma.team.findFirst({
    where: {
      teamLeaderId: user.id,
      NOT: { id: team.id },
    },
  });

  if (alreadyLeading) {
    throw new Error(`${user.name} already leads "${alreadyLeading.name}".`);
  }

  // Both updates succeed together or fail together
  const [, updatedTeam] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { teamId: team.id }, // leader is also a member of the team
    }),
    prisma.team.update({
      where: { id: team.id },
      data: { teamLeaderId: user.id },
      include: { teamLeader: true, members: true },
    }),
  ]);

  return updatedTeam;
};