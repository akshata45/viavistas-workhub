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
import { getMyTeam } from "../../services/tlService";
import TaskFormModal from "../../components/tasks/TaskFormModal";
import LeaderScoreCard from "../../components/votes/LeaderScoreCard";
import { getUser, logout } from "../../utils/auth";

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

const percent = (part, total) =>
  total === 0 ? null : Math.round((part / total) * 100);

const showPercent = (value) => (value === null ? "–" : `${value}%`);

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

function TLDashboard() {
  const navigate = useNavigate();

  const user = getUser();

  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("REVIEW");

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

  const loadData = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError("");

      const [tasksData, teamData] = await Promise.all([
        getTasks(),
        getMyTeam(),
      ]);

      setTasks(tasksData.tasks || []);
      setTeam(teamData.team || null);
    } catch (err) {
      setError(err.message || "Unable to load your dashboard.");
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
    await loadData(false);

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

  const handleReview = async (decision) => {
    try {
      setWorking(true);
      setDetailError("");

      await reviewTask(selectedId, decision, reviewFeedback);

      setReviewFeedback("");
      await loadDetail(selectedId);
      await loadData(false);
    } catch (err) {
      setDetailError(err.message || "Unable to review task.");
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

  // Work given to the team (the TL's own tasks live on "My own work")
  const teamTasks = tasks.filter((task) => task.assignedToId !== user?.id);

  const reviewQueue = teamTasks.filter((task) => task.status === "SUBMITTED");

  const approvedTasks = teamTasks.filter((task) => task.status === "APPROVED");

  const activeTasks = teamTasks.filter((task) => task.status !== "APPROVED");

  const overdueCount = teamTasks.filter(isOverdue).length;

  const teamCompletion = percent(approvedTasks.length, teamTasks.length);

  // Only employees can receive tasks from a Team Leader
  const teamEmployees = (team?.members || []).filter(
    (member) => member.role === "EMPLOYEE"
  );

  const memberStats = teamEmployees.map((member) => {
    const memberTasks = teamTasks.filter(
      (task) => task.assignedToId === member.id
    );

    const approved = memberTasks.filter((task) => task.status === "APPROVED");

    return {
      ...member,
      total: memberTasks.length,
      open: memberTasks.filter((task) => task.status !== "APPROVED").length,
      inReview: memberTasks.filter((task) => task.status === "SUBMITTED")
        .length,
      approved: approved.length,
      points: approved.reduce(
        (sum, task) => sum + (task.awardedPoints || 0),
        0
      ),
      completion: percent(approved.length, memberTasks.length),
    };
  });

  // People a Team Leader can assign work to
  const assignees = teamEmployees.map((member) => ({
    id: member.id,
    label: member.name,
  }));

  // A Team Leader can edit tasks they created, until work is submitted
  const canEditDetail =
    detail &&
    detail.createdBy?.id === user?.id &&
    detail.status !== "APPROVED" &&
    detail.status !== "SUBMITTED";

  const canReviewDetail =
    detail &&
    detail.status === "SUBMITTED" &&
    detail.assignedToId !== user?.id;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f7f7f5] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              ViaVistas WorkHub
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#111111]">
              Team Leader Dashboard
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Welcome back, {user?.name}
              {team && ` · ${team.name}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-100"
            >
              My own work
            </button>
                        <button
              onClick={() => navigate("/leaderboard")}
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-100"
            >
              Leaderboard
            </button>

            <button
              onClick={openCreate}
              disabled={!team}
              className="rounded-xl bg-[#c4dc47] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#b5cd3a] disabled:opacity-50"
            >
              Create Task
            </button>

            <button
              onClick={() => navigate("/change-password")}
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-100"
            >
              Change password
            </button>

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

        {!loading && !team && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            You are not assigned to a team yet. Ask the Director to assign you
            as a Team Leader on the Teams page. You can still do your own work
            from "My own work".
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Team members" value={teamEmployees.length} />
          <StatCard label="Active tasks" value={activeTasks.length} />
          <StatCard label="Needs review" value={reviewQueue.length} />
          <StatCard label="Overdue" value={overdueCount} />
          <StatCard
            label="Completion rate"
            value={showPercent(teamCompletion)}
            highlights
          />
        </div>

        {/* My leadership score */}
        <LeaderScoreCard />
        {/* Tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ["REVIEW", `Needs Review (${reviewQueue.length})`],
            ["TASKS", `Team Tasks (${teamTasks.length})`],
            ["MEMBERS", `Members (${teamEmployees.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === key
                  ? "bg-[#111111] text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500">
            Loading your dashboard...
          </div>
        ) : (
          <>
            {/* ---------------- NEEDS REVIEW ---------------- */}
            {tab === "REVIEW" &&
              (reviewQueue.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center">
                  <h2 className="text-lg font-bold text-[#111111]">
                    Nothing waiting for review
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    When someone on your team submits work, it will appear
                    here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviewQueue.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => openTask(task.id)}
                      className="cursor-pointer rounded-2xl border-2 border-amber-200 bg-white p-5 transition hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-[#111111]">
                            {task.title}
                          </h3>
                          <p className="mt-1 text-xs text-neutral-400">
                            Submitted by {task.assignedTo?.name} on{" "}
                            {formatDate(task.submittedAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={PRIORITY_STYLES[task.priority]}>
                            {task.priority}
                          </Badge>
                          <Badge className="bg-neutral-100 text-neutral-700">
                            {task.points} pts
                          </Badge>
                        </div>
                      </div>

                      {task.submissionNote && (
                        <p className="mt-3 line-clamp-2 text-sm text-neutral-600">
                          “{task.submissionNote}”
                        </p>
                      )}

                      <p className="mt-3 text-sm font-semibold text-amber-700">
                        Click to review →
                      </p>
                    </div>
                  ))}
                </div>
              ))}

            {/* ---------------- TEAM TASKS ---------------- */}
            {tab === "TASKS" &&
              (teamTasks.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center">
                  <h2 className="text-lg font-bold text-[#111111]">
                    No team tasks yet
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    Use “Create Task” to assign work to your team.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
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
                        {teamTasks.map((task) => (
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
                                by {task.createdBy?.name}
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
                              {task.status === "APPROVED"
                                ? task.awardedPoints
                                : task.points}
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
              ))}

            {/* ---------------- MEMBERS ---------------- */}
            {tab === "MEMBERS" &&
              (memberStats.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center">
                  <h2 className="text-lg font-bold text-[#111111]">
                    No team members yet
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    Ask the Director to add employees to your team.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-neutral-100 text-left">
                          {[
                            "Employee",
                            "Open",
                            "In review",
                            "Approved",
                            "Points",
                            "Completion",
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
                        {memberStats.map((member) => (
                          <tr
                            key={member.id}
                            className="border-b border-neutral-100 last:border-0"
                          >
                            <td className="px-6 py-5">
                              <p className="font-bold text-[#111111]">
                                {member.name}
                              </p>
                              <p className="mt-1 text-xs text-neutral-400">
                                {member.email}
                              </p>
                            </td>

                            <td className="px-6 py-5 text-sm text-neutral-700">
                              {member.open}
                            </td>

                            <td className="px-6 py-5 text-sm text-neutral-700">
                              {member.inReview}
                            </td>

                            <td className="px-6 py-5 text-sm text-neutral-700">
                              {member.approved}
                            </td>

                            <td className="px-6 py-5 text-sm font-semibold text-neutral-800">
                              {member.points}
                            </td>

                            <td className="px-6 py-5">
                              <Badge className="bg-lime-100 text-lime-800">
                                {showPercent(member.completion)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </>
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
                  <InfoItem label="Assigned to">
                    {detail.assignedTo?.name}
                  </InfoItem>
                  <InfoItem label="Created by">
                    {detail.createdBy?.name}
                  </InfoItem>
                  <InfoItem label="Deadline">
                    {formatDate(detail.deadline)}
                  </InfoItem>
                  <InfoItem label="Points">
                    {detail.status === "APPROVED"
                      ? `${detail.awardedPoints} awarded`
                      : `${detail.points} available`}
                  </InfoItem>
                </div>

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
                {canReviewDetail && (
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
      {taskForm &&
        (assignees.length === 0 ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6">
              <h2 className="text-xl font-extrabold text-[#111111]">
                No team members yet
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Your team has no employees yet. Ask the Director to add
                employees to your team first.
              </p>
              <button
                onClick={() => setTaskForm(null)}
                className="mt-5 w-full rounded-xl bg-[#111111] py-3 text-sm font-bold text-white hover:bg-[#242424]"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <TaskFormModal
            mode={taskForm.mode}
            task={taskForm.task}
            assignees={assignees}
            onSave={handleSaveTask}
            onClose={() => setTaskForm(null)}
          />
        ))}
    </div>
  );
}

export default TLDashboard;