import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  reviewTask,
  addTaskComment,
} from "../../services/taskService";
import { getUsers } from "../../services/userService";
import TaskFormModal from "../../components/tasks/TaskFormModal";

// --------------------------------------------------
// LOOKUPS
// --------------------------------------------------

const STATUS_LABELS = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Needs Review",
  APPROVED: "Approved",
};

const STATUS_STYLES = {
  ASSIGNED: "bg-neutral-100 text-neutral-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-amber-100 text-amber-800",
  APPROVED: "bg-lime-100 text-lime-800",
};

const PRIORITY_STYLES = {
  LOW: "bg-neutral-100 text-neutral-600",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-700",
};

const FILTERS = ["ALL", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "APPROVED"];

// --------------------------------------------------
// SMALL HELPERS
// --------------------------------------------------

const formatDate = (value) => {
  if (!value) return "No deadline";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const isOverdue = (task) =>
  task.deadline &&
  task.status !== "APPROVED" &&
  new Date(task.deadline) < new Date();

function Badge({ className, children }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function InfoItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <div className="mt-1 text-sm text-neutral-800">{children}</div>
    </div>
  );
}

// --------------------------------------------------
// PAGE
// --------------------------------------------------

function AllTasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("ALL");

  // Create / edit task popup (null = closed)
  const [taskForm, setTaskForm] = useState(null);

  // Task detail popup
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [working, setWorking] = useState(false);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [tasksData, usersData] = await Promise.all([
        getTasks(),
        getUsers(),
      ]);

      setTasks(tasksData.tasks || []);
      setUsers(usersData.users || []);
    } catch (err) {
      setError(err.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadDetail = async (id) => {
    try {
      setDetailError("");
      const data = await getTask(id);
      setDetail(data.task);
    } catch (err) {
      setDetailError(err.message || "Unable to load task.");
    }
  };

  // --------------------------------------------------
  // CREATE / EDIT TASK
  // --------------------------------------------------

  const openCreate = () => {
    setTaskForm({ mode: "create" });
  };

  const openEdit = () => {
    setTaskForm({ mode: "edit", task: detail });
  };

  const handleSaveTask = async (payload) => {
    if (taskForm.mode === "edit") {
      await updateTask(taskForm.task.id, payload);
    } else {
      await createTask(payload);
    }

    const editedId = taskForm.mode === "edit" ? taskForm.task.id : null;

    setTaskForm(null);
    await loadData();

    if (editedId !== null && editedId === selectedId) {
      await loadDetail(editedId);
    }
  };

  // --------------------------------------------------
  // TASK DETAIL
  // --------------------------------------------------

  const openTask = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setCommentText("");
    setReviewFeedback("");
    setDetailError("");
    setDetailLoading(true);

    await loadDetail(id);

    setDetailLoading(false);
  };

  const closeTask = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailError("");
  };

  const handleComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    try {
      setWorking(true);
      await addTaskComment(selectedId, commentText);
      setCommentText("");
      await loadDetail(selectedId);
    } catch (err) {
      setDetailError(err.message || "Unable to add comment.");
    } finally {
      setWorking(false);
    }
  };

  const handleReview = async (decision) => {
    try {
      setWorking(true);
      setDetailError("");

      await reviewTask(selectedId, decision, reviewFeedback);

      setReviewFeedback("");
      await loadDetail(selectedId);
      await loadData();
    } catch (err) {
      setDetailError(err.message || "Unable to review task.");
    } finally {
      setWorking(false);
    }
  };

  // --------------------------------------------------
  // DERIVED DATA
  // --------------------------------------------------

  const countFor = (status) =>
    status === "ALL"
      ? tasks.length
      : tasks.filter((task) => task.status === status).length;

  const visibleTasks =
    filter === "ALL"
      ? tasks
      : tasks.filter((task) => task.status === filter);

  // Directors can assign to active Employees and Team Leaders
  const assignees = users
    .filter((user) => user.isActive && user.role !== "DIRECTOR")
    .map((user) => ({
      id: user.id,
      label: `${user.name} (${user.role}${
        user.team ? ` · ${user.team.name}` : ""
      })`,
    }));

  // The Director can edit any task that is not approved or waiting for review
  const canEditDetail =
    detail && detail.status !== "APPROVED" && detail.status !== "SUBMITTED";

  const filterLabel = (status) =>
    status === "ALL" ? "All" : STATUS_LABELS[status];

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f7f7f5] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/director")}
              className="text-xs font-semibold text-neutral-400 hover:text-black"
            >
              ← Back to dashboard
            </button>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              ViaVistas WorkHub
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#111111]">
              Work &amp; Tasks
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Assign work, track progress and approve submissions.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="rounded-xl bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#242424]"
          >
            Create Task
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Filter tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === status
                  ? "bg-[#111111] text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {filterLabel(status)} ({countFor(status)})
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500">
            Loading tasks...
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-[#111111]">
              {tasks.length === 0 ? "No tasks yet" : "Nothing in this filter"}
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              {tasks.length === 0
                ? "Create your first task to get work moving."
                : "Try a different filter above."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-neutral-100 text-left">
                    {[
                      "Task",
                      "Assigned To",
                      "Priority",
                      "Points",
                      "Deadline",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {visibleTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => openTask(task.id)}
                      className="cursor-pointer border-b border-neutral-100 transition last:border-0 hover:bg-neutral-50"
                    >
                      <td className="px-6 py-5">
                        <p className="font-bold text-[#111111]">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {task.team?.name || "No team"} · by{" "}
                          {task.createdBy?.name}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-neutral-700">
                        {task.assignedTo?.name}
                      </td>

                      <td className="px-6 py-5">
                        <Badge className={PRIORITY_STYLES[task.priority]}>
                          {task.priority}
                        </Badge>
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-neutral-700">
                        {task.points}
                      </td>

                      <td
                        className={`px-6 py-5 text-sm ${
                          isOverdue(task)
                            ? "font-semibold text-red-600"
                            : "text-neutral-600"
                        }`}
                      >
                        {formatDate(task.deadline)}
                        {isOverdue(task) && " (overdue)"}
                      </td>

                      <td className="px-6 py-5">
                        <Badge className={STATUS_STYLES[task.status]}>
                          {STATUS_LABELS[task.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------ */}
      {/* TASK DETAIL POPUP                                 */}
      {/* ------------------------------------------------ */}
      {selectedId !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              {canEditDetail ? (
                <button
                  onClick={openEdit}
                  className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Edit task
                </button>
              ) : (
                <span />
              )}

              <button
                onClick={closeTask}
                className="text-xl text-neutral-400 hover:text-black"
              >
                ×
              </button>
            </div>

            {detailLoading && (
              <p className="py-10 text-center text-sm text-neutral-500">
                Loading task...
              </p>
            )}

            {detailError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {detailError}
              </div>
            )}

            {detail && (
              <div>
                {/* Title + badges */}
                <h2 className="text-2xl font-extrabold text-[#111111]">
                  {detail.title}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={STATUS_STYLES[detail.status]}>
                    {STATUS_LABELS[detail.status]}
                  </Badge>
                  <Badge className={PRIORITY_STYLES[detail.priority]}>
                    {detail.priority}
                  </Badge>
                  <Badge className="bg-neutral-100 text-neutral-700">
                    {detail.difficulty}
                  </Badge>
                </div>

                {detail.description && (
                  <p className="mt-5 whitespace-pre-wrap text-sm text-neutral-700">
                    {detail.description}
                  </p>
                )}

                {/* Info grid */}
                <div className="mt-6 grid grid-cols-2 gap-5 rounded-xl bg-neutral-50 p-5">
                  <InfoItem label="Assigned to">
                    {detail.assignedTo?.name}
                  </InfoItem>
                  <InfoItem label="Created by">
                    {detail.createdBy?.name}
                  </InfoItem>
                  <InfoItem label="Team">
                    {detail.team?.name || "No team"}
                  </InfoItem>
                  <InfoItem label="Deadline">
                    {formatDate(detail.deadline)}
                  </InfoItem>
                  <InfoItem label="Points">
                    {detail.status === "APPROVED"
                      ? `${detail.awardedPoints} awarded`
                      : `${detail.points} available`}
                  </InfoItem>
                  <InfoItem label="Submitted">
                    {detail.submittedAt
                      ? formatDate(detail.submittedAt)
                      : "Not yet"}
                  </InfoItem>
                </div>

                {/* Submission note */}
                {detail.submissionNote && (
                  <div className="mt-5 rounded-xl border border-neutral-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Submission note
                    </p>
                    <p className="mt-1 text-sm text-neutral-800">
                      {detail.submissionNote}
                    </p>
                  </div>
                )}

                {/* Earlier review feedback */}
                {detail.reviewFeedback && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      {detail.status === "APPROVED"
                        ? "Review note"
                        : "Returned for changes"}
                      {detail.reviewedBy && ` · ${detail.reviewedBy.name}`}
                    </p>
                    <p className="mt-1 text-sm text-neutral-800">
                      {detail.reviewFeedback}
                    </p>
                  </div>
                )}

                {/* Review controls */}
                {detail.status === "SUBMITTED" && (
                  <div className="mt-6 rounded-xl border-2 border-amber-300 p-5">
                    <h3 className="font-bold text-[#111111]">
                      Review this submission
                    </h3>

                    <textarea
                      value={reviewFeedback}
                      onChange={(e) => setReviewFeedback(e.target.value)}
                      placeholder="Feedback (required if you reject)"
                      rows={3}
                      className="mt-3 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => handleReview("APPROVE")}
                        disabled={working}
                        className="flex-1 rounded-xl bg-lime-500 py-3 text-sm font-bold text-black hover:bg-lime-400 disabled:opacity-60"
                      >
                        Approve ({detail.points} pts)
                      </button>

                      <button
                        onClick={() => handleReview("REJECT")}
                        disabled={working}
                        className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div className="mt-8">
                  <h3 className="font-bold text-[#111111]">
                    Comments ({detail.comments?.length || 0})
                  </h3>

                  <div className="mt-3 space-y-3">
                    {detail.comments?.length === 0 && (
                      <p className="text-sm text-neutral-400">
                        No comments yet.
                      </p>
                    )}

                    {detail.comments?.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-xl bg-neutral-50 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-neutral-800">
                            {comment.author?.name}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleComment} className="mt-4 flex gap-3">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="h-11 flex-1 rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
                    />

                    <button
                      type="submit"
                      disabled={working || !commentText.trim()}
                      className="rounded-xl bg-[#111111] px-5 text-sm font-bold text-white hover:bg-[#242424] disabled:opacity-50"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* CREATE / EDIT TASK POPUP                          */}
      {/* ------------------------------------------------ */}
      {taskForm && (
        <TaskFormModal
          mode={taskForm.mode}
          task={taskForm.task}
          assignees={assignees}
          canSetPoints
          onSave={handleSaveTask}
          onClose={() => setTaskForm(null)}
        />
      )}
    </div>
  );
}

export default AllTasks;