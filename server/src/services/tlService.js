import prisma from "../config/prisma.js";

// Returns the Team Leader's own team with its active members.
// Returns null if the Team Leader has not been assigned to a team yet.
export const getTeamForLeader = async (user) => {
  if (!user.teamId) {
    return null;
  }

  return prisma.team.findUnique({
    where: { id: user.teamId },
    select: {
      id: true,
      name: true,
      description: true,
      members: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
};