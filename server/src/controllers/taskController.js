import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  changeTaskStatus,
  reviewTask,
  addTaskComment,
} from "../services/taskService.js";

// Sends the right response for an error.
// Errors we created on purpose (400, 403, 404...) show their message.
// Anything unexpected is logged and shown as a generic 500.
const sendError = (res, error, fallbackMessage) => {
  if (error.status) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
    });
  }

  console.error(fallbackMessage, error);

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

export const listTasks = async (req, res) => {
  try {
    const tasks = await getTasks(req.user, req.query);

    return res.json({ success: true, tasks });
  } catch (error) {
    return sendError(res, error, "Unable to fetch tasks.");
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await getTaskById(req.user, req.params.id);

    return res.json({ success: true, task });
  } catch (error) {
    return sendError(res, error, "Unable to fetch task.");
  }
};

export const addTask = async (req, res) => {
  try {
    const task = await createTask(req.user, req.body);

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    return sendError(res, error, "Unable to create task.");
  }
};

export const editTask = async (req, res) => {
  try {
    const task = await updateTask(req.user, req.params.id, req.body);

    return res.json({
      success: true,
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    return sendError(res, error, "Unable to update task.");
  }
};

export const setTaskStatus = async (req, res) => {
  try {
    const task = await changeTaskStatus(req.user, req.params.id, req.body);

    return res.json({
      success: true,
      message: "Task status updated.",
      task,
    });
  } catch (error) {
    return sendError(res, error, "Unable to update task status.");
  }
};

export const reviewSubmittedTask = async (req, res) => {
  try {
    const task = await reviewTask(req.user, req.params.id, req.body);

    return res.json({
      success: true,
      message: "Task reviewed.",
      task,
    });
  } catch (error) {
    return sendError(res, error, "Unable to review task.");
  }
};

export const addComment = async (req, res) => {
  try {
    const comment = await addTaskComment(
      req.user,
      req.params.id,
      req.body.content
    );

    return res.status(201).json({
      success: true,
      message: "Comment added.",
      comment,
    });
  } catch (error) {
    return sendError(res, error, "Unable to add comment.");
  }
};