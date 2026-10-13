import { useState } from "react";

const DEFAULT_POINTS = {
  EASY: 5,
  MEDIUM: 10,
  HARD: 20,
  CRITICAL: 40,
};

const buildInitialForm = (task) => ({
  title: task?.title || "",
  description: task?.description || "",
  assignedToId: task ? String(task.assignedToId) : "",
  priority: task?.priority || "MEDIUM",
  difficulty: task?.difficulty || "MEDIUM",
  points: "",
  deadline: task?.deadline ? task.deadline.slice(0, 10) : "",
});

// Used for both creating and editing a task.
//
// mode         "create" or "edit"
// task         the task being edited (edit mode only)
// assignees    [{ id, label }] people the task can be assigned to
// canSetPoints true for the Director (can type custom points)
// onSave       async (payload) => saves it; throw an Error to show a message
// onClose      closes the popup
function TaskFormModal({
  mode,
  task,
  assignees,
  canSetPoints = false,
  onSave,
  onClose,
}) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() =>
    buildInitialForm(isEdit ? task : null)
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Keep the current assignee in the list even if they are no longer
  // in the normal choices (for example, an inactive employee).
  const options =
    isEdit && !assignees.some((person) => person.id === task.assignedToId)
      ? [
          {
            id: task.assignedToId,
            label: `${task.assignedTo?.name || "Current assignee"} (current)`,
          },
          ...assignees,
        ]
      : assignees;

  const assigneeChanged =
    isEdit && Number(form.assignedToId) !== task.assignedToId;

  const difficultyChanged = isEdit && form.difficulty !== task.difficulty;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title: form.title,
      description: form.description,
      assignedToId: Number(form.assignedToId),
      priority: form.priority,
      deadline: form.deadline || null,
    };

    // When editing, only send the difficulty if it really changed,
    // because a new difficulty resets the points to its default.
    if (!isEdit || difficultyChanged) {
      payload.difficulty = form.difficulty;
    }

    if (canSetPoints && form.points !== "") {
      payload.points = Number(form.points);
    }

    try {
      setSaving(true);
      setError("");

      await onSave(payload);
    } catch (err) {
      setError(err.message || "Unable to save task.");
      setSaving(false);
    }
  };

  const pointsPlaceholder = !isEdit
    ? `Default: ${DEFAULT_POINTS[form.difficulty]}`
    : difficultyChanged
    ? `New default: ${DEFAULT_POINTS[form.difficulty]}`
    : `Current: ${task.points}`;

  const worthPoints =
    isEdit && !difficultyChanged ? task.points : DEFAULT_POINTS[form.difficulty];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#111111]">
              {isEdit ? "Edit Task" : "Create Task"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {isEdit
                ? "Change the details, deadline or who it is assigned to."
                : "Assign work to a team member."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-xl text-neutral-400 hover:text-black"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Task title"
            required
            className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description (optional)"
            rows={3}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black"
          />

          <select
            name="assignedToId"
            value={form.assignedToId}
            onChange={handleChange}
            required
            className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
          >
            <option value="">Assign to...</option>

            {options.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>

          {assigneeChanged && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              Reassigning resets progress. The new person starts from "To Do".
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-500">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-500">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={form.difficulty}
                onChange={handleChange}
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className={canSetPoints ? "grid grid-cols-2 gap-4" : ""}>
            {canSetPoints && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-500">
                  Points (optional)
                </label>
                <input
                  name="points"
                  type="number"
                  min="0"
                  max="500"
                  value={form.points}
                  onChange={handleChange}
                  placeholder={pointsPlaceholder}
                  className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-500">
                Deadline
              </label>
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          {!canSetPoints && (
            <p className="text-xs text-neutral-500">
              This task will be worth{" "}
              <span className="font-bold">{worthPoints} points</span>, based
              on its difficulty.
            </p>
          )}

          {canSetPoints && difficultyChanged && (
            <p className="text-xs text-neutral-500">
              Changing the difficulty resets the points to the new default,
              unless you type points above.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-12 w-full rounded-xl bg-[#111111] text-sm font-bold text-white hover:bg-[#242424] disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : isEdit
              ? "Save Changes"
              : "Create Task"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TaskFormModal;