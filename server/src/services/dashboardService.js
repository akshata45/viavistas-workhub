import prisma from "../config/prisma.js";

export const getDirectorStats = async () => {
  // Active staff only (the Director is not counted as an "employee")
  const employees = await prisma.user.count({
    where: {
      isActive: true,
      role: { in: ["EMPLOYEE", "TL"] },
    },
  });

  const teams = await prisma.team.count();

  // Pending = assigned, in progress, or waiting for review
  const pendingWork = await prisma.task.count({
    where: { status: { not: "APPROVED" } },
  });

  const completed = await prisma.task.count({
    where: { status: "APPROVED" },
  });

  return {
    employees,
    teams,
    pendingWork,
    completed,
  };
};