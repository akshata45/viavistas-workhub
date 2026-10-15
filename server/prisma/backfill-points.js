// One-time script: creates points history for tasks that were approved
// BEFORE the points ledger existed. Safe to run more than once.
//
// Run from the server folder:   node prisma/backfill-points.js

import prisma from "../src/config/prisma.js";

const run = async () => {
  const approved = await prisma.task.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      title: true,
      points: true,
      awardedPoints: true,
      teamId: true,
      assignedToId: true,
      reviewedById: true,
      completedAt: true,
      updatedAt: true,
    },
  });

  let created = 0;
  let skipped = 0;

  for (const task of approved) {
    const existing = await prisma.pointTransaction.findFirst({
      where: { taskId: task.id, type: "TASK_APPROVAL" },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.pointTransaction.create({
      data: {
        points: task.awardedPoints ?? task.points,
        type: "TASK_APPROVAL",
        reason: `Approved: ${task.title}`,
        userId: task.assignedToId,
        teamId: task.teamId,
        taskId: task.id,
        awardedById: task.reviewedById,
        createdAt: task.completedAt || task.updatedAt,
      },
    });

    created += 1;
  }

  console.log(
    `Done. Added ${created} points entries, skipped ${skipped} that already existed.`
  );
};

run()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });