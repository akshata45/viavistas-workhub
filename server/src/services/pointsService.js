import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";
import { MAX_TASK_POINTS } from "../constants/taskRules.js";

// India has no daylight saving time, so a fixed offset is safe.
// Months start and end at midnight India time.
const TIME_ZONE = "Asia/Kolkata";
const TIME_OFFSET = "+05:30";

const pad = (number) => String(number).padStart(2, "0");

// "2026-10" for the current month in India
export const currentMonthKey = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;

  return `${year}-${month}`;
};

// Start and end of a month, e.g. "2026-10"
export const getMonthRange = (value) => {
  const key = value || currentMonthKey();

  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(key);

  if (!match) {
    throw httpError(400, "Month must look like 2026-10.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    key,
    start: new Date(`${year}-${pad(month)}-01T00:00:00${TIME_OFFSET}`),
    end: new Date(`${nextYear}-${pad(nextMonth)}-01T00:00:00${TIME_OFFSET}`),
  };
};

// Gives ranks 1, 2, 3... People or teams with the same score share a rank
// (1, 2, 2, 4). Anyone with nothing scored yet gets no rank.
const assignRanks = (rows, compare, hasScore) => {
  const sorted = [...rows].sort(compare);

  let previousKey = null;
  let previousRank = 0;

  return sorted.map((row, index) => {
    const { rankKey, ...rest } = row;

    if (!hasScore(row)) {
      return { ...rest, rank: null };
    }

    const rank = rankKey === previousKey ? previousRank : index + 1;

    previousKey = rankKey;
    previousRank = rank;

    return { ...rest, rank };
  });
};

// Everything the rankings need for one month
const loadMonth = async (range) => {
  const [people, teams, transactions] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["EMPLOYEE", "TL"] },
      },
      select: {
        id: true,
        name: true,
        role: true,
        team: { select: { id: true, name: true } },
      },
    }),
    prisma.team.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        teamLeader: { select: { name: true } },
        members: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    }),
    prisma.pointTransaction.findMany({
      where: {
        createdAt: { gte: range.start, lt: range.end },
      },
      select: {
        userId: true,
        teamId: true,
        points: true,
        type: true,
      },
    }),
  ]);

  return { people, teams, transactions };
};

const rankPeople = ({ people, transactions }) => {
  const rows = people.map((person) => {
    const mine = transactions.filter((item) => item.userId === person.id);

    const points = mine.reduce((sum, item) => sum + item.points, 0);
    const tasksApproved = mine.filter(
      (item) => item.type === "TASK_APPROVAL"
    ).length;

    return {
      userId: person.id,
      name: person.name,
      role: person.role,
      team: person.team,
      points,
      tasksApproved,
      rankKey: `${points}|${tasksApproved}`,
    };
  });

  return assignRanks(
    rows,
    (a, b) =>
      b.points - a.points ||
      b.tasksApproved - a.tasksApproved ||
      a.name.localeCompare(b.name),
    (row) => row.points !== 0
  );
};

const rankTeams = ({ teams, transactions }) => {
  const rows = teams.map((team) => {
    const mine = transactions.filter((item) => item.teamId === team.id);

    const points = mine.reduce((sum, item) => sum + item.points, 0);
    const members = team.members.length;

    // Ranked by points per member, so small teams compete fairly
    const average = members > 0 ? Math.round((points / members) * 10) / 10 : 0;

    return {
      teamId: team.id,
      name: team.name,
      leader: team.teamLeader?.name || null,
      members,
      points,
      average,
      tasksApproved: mine.filter((item) => item.type === "TASK_APPROVAL")
        .length,
      rankKey: `${average}|${points}`,
    };
  });

  return assignRanks(
    rows,
    (a, b) =>
      b.average - a.average ||
      b.points - a.points ||
      a.name.localeCompare(b.name),
    (row) => row.points !== 0
  );
};

// --------------------------------------------------
// LEADERBOARD (everyone can see it)
// --------------------------------------------------

export const getLeaderboard = async (monthValue) => {
  const range = getMonthRange(monthValue);
  const data = await loadMonth(range);

  return {
    month: range.key,
    currentMonth: currentMonthKey(),
    people: rankPeople(data),
    teams: rankTeams(data),
  };
};

// --------------------------------------------------
// MY POINTS (Employee / Team Leader)
// --------------------------------------------------

export const getMyPoints = async (user, monthValue) => {
  const range = getMonthRange(monthValue);

  const [total, history, data] = await Promise.all([
    prisma.pointTransaction.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    }),
    prisma.pointTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        points: true,
        type: true,
        reason: true,
        createdAt: true,
        task: { select: { id: true, title: true } },
        awardedBy: { select: { id: true, name: true } },
      },
    }),
    loadMonth(range),
  ]);

  const ranking = rankPeople(data);
  const me = ranking.find((person) => person.userId === user.id);

  return {
    points: {
      allTime: total._sum.points || 0,
      month: me ? me.points : 0,
      monthKey: range.key,
      rank: me ? me.rank : null,
      outOf: ranking.length,
    },
    history,
  };
};

// --------------------------------------------------
// BONUS / ADJUSTMENT (Director only)
// --------------------------------------------------

export const awardBonus = async (director, { userId, points, reason }) => {
  const id = Number(userId);

  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, "Please choose who receives the points.");
  }

  const value = Number(points);

  if (
    !Number.isInteger(value) ||
    value === 0 ||
    Math.abs(value) > MAX_TASK_POINTS
  ) {
    throw httpError(
      400,
      `Points must be a whole number between -${MAX_TASK_POINTS} and ${MAX_TASK_POINTS}, and not zero.`
    );
  }

  const cleanReason = String(reason || "").trim();

  if (!cleanReason) {
    throw httpError(400, "A reason is required so the history makes sense.");
  }

  if (cleanReason.length > 200) {
    throw httpError(400, "The reason is too long (max 200 characters).");
  }

  const target = await prisma.user.findUnique({ where: { id } });

  if (!target) {
    throw httpError(400, "The selected person was not found.");
  }

  if (!target.isActive) {
    throw httpError(400, "Points cannot be given to an inactive account.");
  }

  if (target.role === "DIRECTOR") {
    throw httpError(400, "Points cannot be given to a Director.");
  }

  return prisma.pointTransaction.create({
    data: {
      points: value,
      type: value > 0 ? "BONUS" : "ADJUSTMENT",
      reason: cleanReason,
      userId: target.id,
      teamId: target.teamId,
      awardedById: director.id,
    },
    select: {
      id: true,
      points: true,
      type: true,
      reason: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
    },
  });
};