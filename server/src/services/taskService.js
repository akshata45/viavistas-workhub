import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";
import {
  TASK_PRIORITIES,
  TASK_DIFFICULTIES,
  DIFFICULTY_POINTS,
  MAX_TASK_POINTS,
} from "../constants/taskRules.js";

const TASK_STATUSES = ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "APPROVED"];

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
};

const taskInclude = {
  assignedTo: { select: userSelect },
  createdBy: { select: userSelect },
  reviewedBy: { select: userSelect },
  team: { select: { id: true, name: true } },
};

// --------------------------------------------------
// PERMISSION HELPERS
// --------------------------------------------------

const isDirector = (user) => user.role === "DIRECTOR";

// Who can edit a task: Director, or the TL who created it
const canManage = (user, task) =>
  isDirector(user) ||
  (user.role === "TL" && task.createdById === user.id);

// Who can review (approve / reject) a submitted task:
// Director, or the TL of that task's team (never their own task)
const canReview = (user, task) =>
  isDirector(user) ||
  (user.role === "TL" &&
    task.teamId !== null &&
    task.teamId === user.teamId &&
    task.assignedToId !== user.id);

// Who can see a task
const canView = (user, task) =>
  canManage(user, task) ||
  canReview(user, task) ||
  task.assignedToId === user.id ||
  (user.role === "TL" &&
    task.teamId !== null &&
    task.teamId === user.teamId);

// --------------------------------------------------
// VALIDATION HELPERS
// --------------------------------------------------

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

const parseId = (value, label) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, `${label} is invalid.`);
  }

  return id;
};

const parseDeadline = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw httpError(400, "Deadline is not a valid date.");
  }

  return date;
};

const parsePoints = (value) => {
  const points = Number(value);

  if (!Number.isInteger(points) || points < 0 || points > MAX_TASK_POINTS) {
    throw httpError(
      400,
      `Points must be a whole number between 0 and ${MAX_TASK_POINTS}.`
    );
  }

  return points;
};

const checkOneOf = (value, allowed, label) => {
  if (!allowed.includes(value)) {
    throw httpError(400, `${label} must be one of: ${allowed.join(", ")}.`);
  }
};

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

// --------------------------------------------------
// LOADERS
// --------------------------------------------------

const loadTask = async (id) => {
  const taskId = parseId(id, "Task ID");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });

  if (!task) {
    throw httpError(404, "Task not found.");
  }

  return task;
};

// Checks who a task is being assigned to, and whether the
// person creating the task is allowed to assign to them.
const resolveAssignee = async (creator, assignedToId) => {
  const id = parseId(assignedToId, "Assignee");

  const assignee = await prisma.user.findUnique({ where: { id } });

  if (!assignee) {
    throw httpError(400, "The selected employee was not found.");
  }

  if (!assignee.isActive) {
    throw httpError(400, "Tasks cannot be assigned to an inactive employee.");
  }

  if (assignee.role === "DIRECTOR") {
    throw httpError(400, "Tasks cannot be assigned to a Director.");
  }

  if (creator.role === "TL") {
    if (!creator.teamId) {
      throw httpError(403, "You are not assigned to a team yet.");
    }

    if (assignee.role !== "EMPLOYEE" || assignee.teamId !== creator.teamId) {
      throw httpError(
        403,
        "Team Leaders can only assign tasks to employees in their own team."
      );
    }
  }

  return assignee;
};

// --------------------------------------------------
// LIST / GET
// --------------------------------------------------

export const getTasks = async (user, filters = {}) => {
  const where = {};

  if (user.role === "EMPLOYEE") {
    where.assignedToId = user.id;
  } else if (user.role === "TL") {
    where.OR = [
      { assignedToId: user.id },
      { createdById: user.id },
      ...(user.teamId ? [{ teamId: user.teamId }] : []),
    ];
  }
  // Director: no restriction, sees everything

  if (filters.status) {
    checkOneOf(filters.status, TASK_STATUSES, "Status");
    where.status = filters.status;
  }

  if (filters.assignedToId && user.role !== "EMPLOYEE") {
    where.assignedToId = parseId(filters.assignedToId, "Assignee");
  }

  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });
};

export const getTaskById = async (user, id) => {
  const taskId = parseId(id, "Task ID");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      ...taskInclude,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: userSelect } },
      },
    },
  });

  if (!task) {
    throw httpError(404, "Task not found.");
  }

  if (!canView(user, task)) {
    throw httpError(403, "You do not have access to this task.");
  }

  return task;
};

// --------------------------------------------------
// CREATE / EDIT
// --------------------------------------------------

export const createTask = async (creator, body) => {
  const title = cleanText(body.title);

  if (!title) {
    throw httpError(400, "Task title is required.");
  }

  const priority = body.priority || "MEDIUM";
  const difficulty = body.difficulty || "MEDIUM";

  checkOneOf(priority, TASK_PRIORITIES, "Priority");
  checkOneOf(difficulty, TASK_DIFFICULTIES, "Difficulty");

  const assignee = await resolveAssignee(creator, body.assignedToId);

  // Points come from difficulty. Only the Director can override them.
  let points = DIFFICULTY_POINTS[difficulty];

  if (isDirector(creator) && hasValue(body.points)) {
    points = parsePoints(body.points);
  }

  return prisma.task.create({
    data: {
      title,
      description: cleanText(body.description) || null,
      priority,
      difficulty,
      points,
      deadline: parseDeadline(body.deadline) ?? null,
      assignedToId: assignee.id,
      createdById: creator.id,
      teamId: assignee.teamId,
    },
    include: taskInclude,
  });
};

export const updateTask = async (user, id, body) => {
  const task = await loadTask(id);

  if (!canManage(user, task)) {
    throw httpError(403, "You do not have permission to edit this task.");
  }

  if (task.status === "APPROVED") {
    throw httpError(400, "Approved tasks can no longer be edited.");
  }

  if (task.status === "SUBMITTED") {
    throw httpError(
      400,
      "This task is waiting for review. Approve or reject it before editing."
    );
  }

  const data = {};

  if (body.title !== undefined) {
    const title = cleanText(body.title);

    if (!title) {
      throw httpError(400, "Task title cannot be empty.");
    }

    data.title = title;
  }

  if (body.description !== undefined) {
    data.description = cleanText(body.description) || null;
  }

  if (body.priority !== undefined) {
    checkOneOf(body.priority, TASK_PRIORITIES, "Priority");
    data.priority = body.priority;
  }

  if (body.difficulty !== undefined) {
    checkOneOf(body.difficulty, TASK_DIFFICULTIES, "Difficulty");

    // Only when the difficulty really changes do the points follow it
    // (unless the Director sets the points directly, below)
    if (body.difficulty !== task.difficulty) {
      data.difficulty = body.difficulty;
      data.points = DIFFICULTY_POINTS[body.difficulty];
    }
  }

  if (isDirector(user) && hasValue(body.points)) {
    data.points = parsePoints(body.points);
  }

  if (body.deadline !== undefined) {
    data.deadline = parseDeadline(body.deadline);
  }

  if (
    hasValue(body.assignedToId) &&
    Number(body.assignedToId) !== task.assignedToId
  ) {
    const assignee = await resolveAssignee(user, body.assignedToId);

    data.assignedToId = assignee.id;
    data.teamId = assignee.teamId;

    // New person starts fresh
    data.status = "ASSIGNED";
    data.submissionNote = null;
    data.submittedAt = null;
  }

  return prisma.task.update({
    where: { id: task.id },
    data,
    include: taskInclude,
  });
};

// --------------------------------------------------
// STATUS (employee)
// --------------------------------------------------

const ALLOWED_TRANSITIONS = {
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["SUBMITTED"],
};

export const changeTaskStatus = async (user, id, { status, note }) => {
  const task = await loadTask(id);

  if (task.assignedToId !== user.id) {
    throw httpError(
      403,
      "Only the person assigned to this task can update its status."
    );
  }

  checkOneOf(status, ["IN_PROGRESS", "SUBMITTED"], "Status");

  if (!ALLOWED_TRANSITIONS[task.status]?.includes(status)) {
    throw httpError(
      400,
      `This task cannot move from ${task.status} to ${status}.`
    );
  }

  const data = { status };

  if (status === "SUBMITTED") {
    data.submittedAt = new Date();
    data.submissionNote = cleanText(note) || null;
  }

  return prisma.task.update({
    where: { id: task.id },
    data,
    include: taskInclude,
  });
};

// --------------------------------------------------
// REVIEW (Director / TL)
// --------------------------------------------------

export const reviewTask = async (user, id, { decision, feedback }) => {
  const task = await loadTask(id);

  const action = String(decision || "").toUpperCase();

  checkOneOf(action, ["APPROVE", "REJECT"], "Decision");

  if (!canReview(user, task)) {
    throw httpError(403, "You are not allowed to review this task.");
  }

  if (task.status !== "SUBMITTED") {
    throw httpError(400, "Only submitted tasks can be reviewed.");
  }

  const cleanFeedback = cleanText(feedback);

  if (action === "REJECT" && !cleanFeedback) {
    throw httpError(
      400,
      "Please add feedback so the employee knows what to fix."
    );
  }

  const data = {
    reviewedById: user.id,
    reviewedAt: new Date(),
    reviewFeedback: cleanFeedback || null,
  };

  if (action === "APPROVE") {
    data.status = "APPROVED";
    data.completedAt = new Date();
    data.awardedPoints = task.points;
  } else {
    // Rejected work goes back to the employee to fix and resubmit
    data.status = "IN_PROGRESS";
  }

  // The approval and the points are saved together: either both
  // happen or neither does. The status check also means two reviewers
  // clicking at the same time cannot both succeed (or pay out twice).
  await prisma.$transaction(async (tx) => {
    const result = await tx.task.updateMany({
      where: { id: task.id, status: "SUBMITTED" },
      data,
    });

    if (result.count === 0) {
      throw httpError(409, "This task was already reviewed.");
    }

    if (action === "APPROVE") {
      await tx.pointTransaction.create({
        data: {
          points: task.points,
          type: "TASK_APPROVAL",
          reason: `Approved: ${task.title}`,
          userId: task.assignedToId,
          teamId: task.teamId,
          taskId: task.id,
          awardedById: user.id,
        },
      });
    }
  });

  return loadTask(task.id);
};

// --------------------------------------------------
// COMMENTS
// --------------------------------------------------

export const addTaskComment = async (user, id, content) => {
  const task = await loadTask(id);

  if (!canView(user, task)) {
    throw httpError(403, "You do not have access to this task.");
  }

  const text = cleanText(content);

  if (!text) {
    throw httpError(400, "Comment cannot be empty.");
  }

  if (text.length > 2000) {
    throw httpError(400, "Comment is too long (max 2000 characters).");
  }

  return prisma.taskComment.create({
    data: {
      content: text,
      taskId: task.id,
      authorId: user.id,
    },
    include: { author: { select: userSelect } },
  });
};