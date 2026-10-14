import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getTasks,
  getTask,
  changeTaskStatus,
  addTaskComment,
} from "../../services/taskService";
import RateLeaderCard from "../../components/votes/RateLeaderCard";
import TotalPointsCard from "../../components/points/TotalPointsCard";
import { getUser, logout } from "../../utils/auth";

// --------------------------------------------------
// LOOKUPS
// --------------------------------------------------

const STATUS_LABELS = {
  ASSIGNED: "To Do",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "In Review",
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

// A task that was sent back by the reviewer
const isReturned = (task) =>
  task.status === "IN_PROGRESS" && Boolean(task.reviewFeedback);

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

function StatCard({ label, value, highlight = false }) {
  return (
    <div
      className={`rounded-2xl p-6 ${
        highlight ? "bg-[#c4dc47]" : "bg-white"
      }`}
    >
      <p
        className={`text-sm ${
          highlight ? "text-neutral-800" : "text-neutral-500"
        }`}
      >
        {label}
      </p>
      <p className="mt-3 text-3xl font-extrabold text-[#111111]">{value}</p>
    </div>
  );
}

// --------------------------------------------------
// PAGE
// --------------------------------------------------

function EmployeeDashboard() {
  const navigate = useNavigate();

  const user = getUser();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("ALL");

  // Task detail popup
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [commentText, setCommentText] = useState("");
  const [working, setWorking] = useState(false);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  const loadData = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError("");

      const data = await getTasks();

      // Team Leaders also receive their team's tasks from the server,
      // so keep only the work assigned to this person.
      setTasks(
        (data.tasks || []).filter((task) => task.assignedToId === user?.id)
      );
    } catch (err) {
      setError(err.message || "Unable to load your tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // ACTIONS
  // --------------------------------------------------

  const openTask = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setSubmissionNote("");
    setCommentText("");
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

  const handleStart = async () => {
    try {
      setWorking(true);
      setDetailError("");

      await changeTaskStatus(selectedId, "IN_PROGRESS");

      await loadDetail(selectedId);
      await loadData(false);
    } catch (err) {
      setDetailError(err.message || "Unable to start this task.");
    } finally {
      setWorking(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setWorking(true);
      setDetailError("");

      await changeTaskStatus(selectedId, "SUBMITTED", submissionNote);

      setSubmissionNote("");
      await loadDetail(selectedId);
      await loadData(false);
    } catch (err) {
      setDetailError(err.message || "Unable to submit this task.");
    } finally {
      setWorking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    try {
      setWorking(true);
      setDetailError("");

      await addTaskComment(selectedId, commentText);

      setCommentText("");
      await loadDetail(selectedId);
    } catch (err) {
      setDetailError(err.message || "Unable to add comment.");
    } finally {
      setWorking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
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

  const returnedCount = tasks.filter(isReturned).length;

  const filterLabel = (status) =>
    status === "ALL" ? "All" : STATUS_LABELS[status];

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f7f7f5] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              ViaVistas WorkHub
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#111111]">
              My Work
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Welcome back, {user?.name}
              {user?.role === "TL" && " · Team Leader"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/leaderboard")}
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-100"
            >
              Leaderboard
            </button>

            {user?.role === "TL" && (
              <button
                onClick={() => navigate("/tl")}
                className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-100"
              >
                Team dashboard
              </button>
            )}

            <button
              onClick={handleLogout}
              className="rounded-xl bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#242424]"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="To do" value={countFor("ASSIGNED")} />
          <StatCard label="In progress" value={countFor("IN_PROGRESS")} />
          <StatCard label="In review" value={countFor("SUBMITTED")} />
          <StatCard label="Approved" value={countFor("APPROVED")} />
                    <TotalPointsCard />
        </div>

        {returnedCount > 0 && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {returnedCount} task{returnedCount === 1 ? " was" : "s were"} sent
            back with feedback. Open {returnedCount === 1 ? "it" : "them"} to
            see what to fix.
          </div>
        )}
        {/* Rate my Team Leader (employees only) */}
        <RateLeaderCard />
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
            Loading your tasks...
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-[#111111]">
              {tasks.length === 0
                ? "No tasks assigned to you yet"
                : "Nothing in this filter"}
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              {tasks.length === 0
                ? "When work is assigned to you, it will show up here."
                : "Try a different filter above."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => openTask(task.id)}
                className="cursor-pointer rounded-2xl bg-white p-5 transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#111111]">
                      {task.title}
                    </h3>

                    <p className="mt-1 text-xs text-neutral-400">
                      Assigned by {task.createdBy?.name}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isReturned(task) && (
                      <Badge className="bg-amber-100 text-amber-800">
                        Returned
                      </Badge>
                    )}

                    <Badge className={PRIORITY_STYLES[task.priority]}>
                      {task.priority}
                    </Badge>

                    <Badge className={STATUS_STYLES[task.status]}>
                      {STATUS_LABELS[task.status]}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                  <span className="text-neutral-600">
                    <span className="font-semibold">
                      {task.status === "APPROVED"
                        ? task.awardedPoints
                        : task.points}
                    </span>{" "}
                    pts
                  </span>

                  <span
                    className={
                      isOverdue(task)
                        ? "font-semibold text-red-600"
                        : "text-neutral-600"
                    }
                  >
                    {formatDate(task.deadline)}
                    {isOverdue(task) && " (overdue)"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------ */}
      {/* TASK DETAIL POPUP                                 */}
      {/* ------------------------------------------------ */}
      {selectedId !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6">
            <div className="mb-4 flex justify-end">
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

                <div className="mt-6 grid grid-cols-2 gap-5 rounded-xl bg-neutral-50 p-5">
                  <InfoItem label="Assigned by">
                    {detail.createdBy?.name}
                  </InfoItem>
                  <InfoItem label="Deadline">
                    {formatDate(detail.deadline)}
                  </InfoItem>
                  <InfoItem label="Points">
                    {detail.status === "APPROVED"
                      ? `${detail.awardedPoints} earned`
                      : `${detail.points} available`}
                  </InfoItem>
                  <InfoItem label="Team">
                    {detail.team?.name || "No team"}
                  </InfoItem>
                </div>

                {/* Reviewer feedback */}
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

                {/* Your submission note */}
                {detail.submissionNote && detail.status !== "ASSIGNED" && (
                  <div className="mt-5 rounded-xl border border-neutral-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Your last submission note
                    </p>
                    <p className="mt-1 text-sm text-neutral-800">
                      {detail.submissionNote}
                    </p>
                  </div>
                )}

                {/* ACTION AREA: depends on the status */}
                {detail.status === "ASSIGNED" && (
                  <div className="mt-6 rounded-xl border-2 border-neutral-200 p-5">
                    <h3 className="font-bold text-[#111111]">
                      Ready to begin?
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      Let your team know you have started working on this.
                    </p>

                    <button
                      onClick={handleStart}
                      disabled={working}
                      className="mt-4 w-full rounded-xl bg-[#111111] py-3 text-sm font-bold text-white hover:bg-[#242424] disabled:opacity-60"
                    >
                      {working ? "Starting..." : "Start work"}
                    </button>
                  </div>
                )}

                {detail.status === "IN_PROGRESS" && (
                  <div className="mt-6 rounded-xl border-2 border-blue-200 p-5">
                    <h3 className="font-bold text-[#111111]">
                      {detail.reviewFeedback
                        ? "Fix the feedback and submit again"
                        : "Finished? Submit for review"}
                    </h3>

                    <textarea
                      value={submissionNote}
                      onChange={(e) => setSubmissionNote(e.target.value)}
                      placeholder="Note for the reviewer: what you did, links to your work, anything they should know (optional)"
                      rows={3}
                      className="mt-3 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                    <button
                      onClick={handleSubmit}
                      disabled={working}
                      className="mt-3 w-full rounded-xl bg-[#c4dc47] py-3 text-sm font-bold text-black hover:bg-[#b5cd3a] disabled:opacity-60"
                    >
                      {working ? "Submitting..." : "Submit for review"}
                    </button>
                  </div>
                )}

                {detail.status === "SUBMITTED" && (
                  <div className="mt-6 rounded-xl bg-amber-50 p-5 text-sm text-amber-800">
                    Submitted on {formatDate(detail.submittedAt)}. Waiting for
                    your reviewer to approve it or send it back.
                  </div>
                )}

                {detail.status === "APPROVED" && (
                  <div className="mt-6 rounded-xl bg-lime-50 p-5 text-sm font-semibold text-lime-800">
                    Approved. You earned {detail.awardedPoints} points for
                    this task.
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
    </div>
  );
}

export default EmployeeDashboard;