import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";
import {
  currentMonthKey,
  getLeaderboard,
  getMonthRange,
} from "./pointsService.js";

// A Team Leader only sees their rating once this many people have voted,
// so a single vote can never be traced back to one person.
export const MIN_VOTES_VISIBLE = 3;

// Leadership score = 60% team performance + 40% employee rating
export const TEAM_WEIGHT = 60;
export const VOTE_WEIGHT = 40;

const MAX_COMMENT_LENGTH = 300;

const round1 = (number) => Math.round(number * 10) / 10;

// --------------------------------------------------
// EMPLOYEE SIDE: rating my Team Leader
// --------------------------------------------------

// Finds the team of this employee and its Team Leader (if there is one)
const findMyLeader = async (user) => {
  if (!user.teamId) {
    return { team: null, leader: null };
  }

  const team = await prisma.team.findUnique({
    where: { id: user.teamId },
    select: {
      id: true,
      name: true,
      isActive: true,
      teamLeader: {
        select: { id: true, name: true, isActive: true },
      },
    },
  });

  if (!team) {
    return { team: null, leader: null };
  }

  const leader =
    team.isActive && team.teamLeader?.isActive
      ? { id: team.teamLeader.id, name: team.teamLeader.name }
      : null;

  return { team: { id: team.id, name: team.name }, leader };
};

export const getMyVote = async (user) => {
  if (user.role !== "EMPLOYEE") {
    throw httpError(403, "Only employees can rate a Team Leader.");
  }

  const month = currentMonthKey();
  const { team, leader } = await findMyLeader(user);

  let vote = null;

  if (leader) {
    const found = await prisma.leaderVote.findUnique({
      where: { voterId_month: { voterId: user.id, month } },
      select: { rating: true, comment: true, tlId: true, updatedAt: true },
    });

    // A vote for a former Team Leader does not count for the new one
    if (found && found.tlId === leader.id) {
      vote = {
        rating: found.rating,
        comment: found.comment,
        updatedAt: found.updatedAt,
      };
    }
  }

  return { month, team, leader, vote };
};

export const submitVote = async (user, { rating, comment }) => {
  if (user.role !== "EMPLOYEE") {
    throw httpError(403, "Only employees can rate a Team Leader.");
  }

  const stars = Number(rating);

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw httpError(400, "Please choose a rating from 1 to 5 stars.");
  }

  const cleanComment = String(comment || "").trim();

  if (cleanComment.length > MAX_COMMENT_LENGTH) {
    throw httpError(
      400,
      `The comment is too long (max ${MAX_COMMENT_LENGTH} characters).`
    );
  }

  const { team, leader } = await findMyLeader(user);

  if (!team) {
    throw httpError(400, "You are not in a team yet, so there is no one to rate.");
  }

  if (!leader) {
    throw httpError(
      400,
      "Your team does not have an active Team Leader to rate yet."
    );
  }

  const month = currentMonthKey();

  const data = {
    tlId: leader.id,
    teamId: team.id,
    rating: stars,
    comment: cleanComment || null,
  };

  // One vote per employee per month: voting again replaces the old one
  await prisma.leaderVote.upsert({
    where: { voterId_month: { voterId: user.id, month } },
    create: { month, voterId: user.id, ...data },
    update: data,
  });

  return {
    month,
    leader,
    vote: { rating: stars, comment: cleanComment || null },
  };
};

// --------------------------------------------------
// SCORES: team performance + employee rating
// --------------------------------------------------

const buildScores = async (monthValue) => {
  const range = getMonthRange(monthValue);

  const [board, leaders, votes] = await Promise.all([
    getLeaderboard(range.key),
    prisma.user.findMany({
      where: {
        role: "TL",
        isActive: true,
        managedTeam: { isNot: null },
      },
      select: {
        id: true,
        name: true,
        managedTeam: {
          select: { id: true, name: true, isActive: true },
        },
      },
    }),
    prisma.leaderVote.findMany({
      where: { month: range.key },
      orderBy: { createdAt: "asc" },
      select: {
        tlId: true,
        rating: true,
        comment: true,
        voter: { select: { id: true, name: true } },
      },
    }),
  ]);

  // The best team's points per member sets the 100 mark
  const bestAverage = Math.max(0, ...board.teams.map((team) => team.average));

  const rows = leaders
    .filter((leader) => leader.managedTeam?.isActive)
    .map((leader) => {
      const teamRow = board.teams.find(
        (team) => team.teamId === leader.managedTeam.id
      );

      if (!teamRow) {
        return null;
      }

      const teamScore =
        bestAverage > 0
          ? (Math.max(0, teamRow.average) / bestAverage) * 100
          : 0;

      const mine = votes.filter((vote) => vote.tlId === leader.id);
      const voteCount = mine.length;

      const voteAverage =
        voteCount > 0
          ? mine.reduce((sum, vote) => sum + vote.rating, 0) / voteCount
          : null;

      const voteScore = voteAverage === null ? null : (voteAverage / 5) * 100;

      // With no votes, the score is based on team performance alone
      const total =
        voteScore === null
          ? teamScore
          : (teamScore * TEAM_WEIGHT + voteScore * VOTE_WEIGHT) / 100;

      return {
        tlId: leader.id,
        name: leader.name,
        teamId: teamRow.teamId,
        teamName: teamRow.name,
        members: teamRow.members,
        teamPoints: teamRow.points,
        teamAverage: teamRow.average,
        teamScore: Math.round(teamScore),
        voteCount,
        voteAverage: voteAverage === null ? null : round1(voteAverage),
        voteScore: voteScore === null ? null : Math.round(voteScore),
        total: Math.round(total),
        comments: mine.map((vote) => ({
          voterName: vote.voter.name,
          rating: vote.rating,
          comment: vote.comment,
        })),
      };
    })
    .filter(Boolean);

  // Highest score first. Equal scores share a rank; a score of 0 has none.
  rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  let previousTotal = null;
  let previousRank = 0;

  const ranked = rows.map((row, index) => {
    if (row.total === 0) {
      return { ...row, rank: null };
    }

    const rank = row.total === previousTotal ? previousRank : index + 1;

    previousTotal = row.total;
    previousRank = rank;

    return { ...row, rank };
  });

  return { month: range.key, currentMonth: currentMonthKey(), rows: ranked };
};

// Director: every Team Leader, with names and comments
export const getLeaderScores = async (monthValue) => {
  const { month, currentMonth, rows } = await buildScores(monthValue);

  return {
    month,
    currentMonth,
    weights: { team: TEAM_WEIGHT, votes: VOTE_WEIGHT },
    minVotes: MIN_VOTES_VISIBLE,
    leaders: rows,
  };
};

// Team Leader: only their own score, and nothing that could reveal
// who voted until enough people have voted.
export const getMyScore = async (user, monthValue) => {
  const { month, currentMonth, rows } = await buildScores(monthValue);

  const mine = rows.find((row) => row.tlId === user.id);

  if (!mine) {
    return {
      month,
      currentMonth,
      hasTeam: false,
      weights: { team: TEAM_WEIGHT, votes: VOTE_WEIGHT },
      minVotes: MIN_VOTES_VISIBLE,
    };
  }

  const visible = mine.voteCount >= MIN_VOTES_VISIBLE;

  return {
    month,
    currentMonth,
    hasTeam: true,
    weights: { team: TEAM_WEIGHT, votes: VOTE_WEIGHT },
    minVotes: MIN_VOTES_VISIBLE,
    teamName: mine.teamName,
    members: mine.members,
    teamAverage: mine.teamAverage,
    teamScore: mine.teamScore,
    rank: visible ? mine.rank : null,
    votes: {
      count: mine.voteCount,
      visible,
      average: visible ? mine.voteAverage : null,
    },
    // The overall score would reveal the rating, so it is hidden too
    total: visible ? mine.total : null,
    // Comments are shown without any names
    comments: visible
      ? mine.comments
          .filter((item) => item.comment)
          .map((item) => ({ rating: item.rating, comment: item.comment }))
      : [],
  };
};