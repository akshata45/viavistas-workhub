const API_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("workhubToken");

// Shared helper: sends the request and throws a readable error
const request = async (path, options = {}, fallbackMessage) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
};

export const getTasks = () =>
  request("/tasks", {}, "Unable to fetch tasks.");

export const getTask = (taskId) =>
  request(`/tasks/${taskId}`, {}, "Unable to fetch task.");

export const createTask = (taskData) =>
  request(
    "/tasks",
    { method: "POST", body: JSON.stringify(taskData) },
    "Unable to create task."
  );

export const updateTask = (taskId, taskData) =>
  request(
    `/tasks/${taskId}`,
    { method: "PATCH", body: JSON.stringify(taskData) },
    "Unable to update task."
  );

export const changeTaskStatus = (taskId, status, note) =>
  request(
    `/tasks/${taskId}/status`,
    { method: "PATCH", body: JSON.stringify({ status, note }) },
    "Unable to update task status."
  );

export const reviewTask = (taskId, decision, feedback) =>
  request(
    `/tasks/${taskId}/review`,
    { method: "PATCH", body: JSON.stringify({ decision, feedback }) },
    "Unable to review task."
  );

export const addTaskComment = (taskId, content) =>
  request(
    `/tasks/${taskId}/comments`,
    { method: "POST", body: JSON.stringify({ content }) },
    "Unable to add comment."
  );