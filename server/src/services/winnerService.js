import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";
import {
  currentMonthKey,
  getLeaderboard,
  getMonthRange,
} from "./pointsService.js";

const winnerSelect = {
  id: true,
  month: true,
  points: true,
  teamName: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true } },
  confirmedBy: { select: { id: true, name: true } },
};

// All past winners, newest month first
export const listWinners = async () => {
  return prisma.employeeOfMonth.findMany({
    orderBy: { month: "desc" },
    take: 24,
    select: winnerSelect,
  });
};

// The Director chooses (or changes) the winner for a month
export const confirmWinner = async (director, { month, userId, note }) => {
  if (!month) {
    throw httpError(400, "Please choose a month.");
  }

  // Throws if the month is not written like 2026-10
  const range = getMonthRange(month);

  if (range.key > currentMonthKey()) {
    throw httpError(
      400,
      "You cannot choose a winner for a month that has not started yet."
    );
  }

  const id = Number(userId);

  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, "Please choose the winner.");
  }

  const cleanNote = String(note || "").trim();

  if (cleanNote.length > 200) {
    throw httpError(400, "The note is too long (max 200 characters).");
  }

  // The winner must be someone who really earned points that month
  const { people } = await getLeaderboard(range.key);

  const candidate = people.find((person) => person.userId === id);

  if (!candidate || candidate.points <= 0) {
    throw httpError(
      400,
      "The winner must be someone who earned points in that month."
    );
  }

  const data = {
    userId: candidate.userId,
    points: candidate.points,
    teamName: candidate.team?.name || null,
    note: cleanNote || null,
    confirmedById: director.id,
  };

  // One winner per month: choosing again replaces the earlier choice
  return prisma.employeeOfMonth.upsert({
    where: { month: range.key },
    create: { month: range.key, ...data },
    update: data,
    select: winnerSelect,
  });
};