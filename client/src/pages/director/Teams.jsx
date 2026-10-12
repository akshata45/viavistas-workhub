import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  assignTeamLeader,
} from "../../services/teamService";
import { getUsers } from "../../services/userService";

const emptyForm = { name: "", description: "" };

function Teams() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [leaders, setLeaders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null); // null = creating
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [teamsData, usersData] = await Promise.all([
        getTeams(),
        getUsers(),
      ]);

      setTeams(teamsData.teams || []);

      // Only active users with the TL role can lead a team
      setLeaders(
        (usersData.users || []).filter(
          (user) => user.role === "TL" && user.isActive
        )
      );
    } catch (err) {
      setError(err.message || "Unable to load teams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const openCreate = () => {
    setEditingTeam(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (team) => {
    setEditingTeam(team);
    setForm({
      name: team.name,
      description: team.description || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTeam(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      if (editingTeam) {
        await updateTeam(editingTeam.id, form);
      } else {
        await createTeam(form);
      }

      closeModal();
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save team.");
      closeModal();
    }
  };

  const handleDelete = async (team) => {
    const memberCount = team.members.length;

    const message =
      memberCount > 0
        ? `Delete "${team.name}"?\n\nIts ${memberCount} member${
            memberCount === 1 ? "" : "s"
          } will become Unassigned. This cannot be undone.`
        : `Delete "${team.name}"?\n\nThis cannot be undone.`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      setError("");
      await deleteTeam(team.id);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete team.");
    }
  };

  const handleAssignLeader = async (teamId, userId) => {
    if (!userId) return;

    try {
      setError("");
      await assignTeamLeader(teamId, Number(userId));
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to assign Team Leader.");
    }
  };

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
              Teams
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Manage departments and team leaders.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="rounded-xl bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#242424]"
          >
            Create Team
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500">
            Loading teams...
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-[#111111]">No teams yet</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Create your first team to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {teams.map((team) => (
              <div key={team.id} className="rounded-2xl bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#111111]">
                      {team.name}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {team.description || "No description"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700">
                      {team.members.length} member
                      {team.members.length === 1 ? "" : "s"}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(team)}
                        className="text-sm font-semibold text-neutral-600 hover:text-black"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(team)}
                        className="text-sm font-semibold text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Team Leader */}
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Team Leader
                  </p>

                  <select
                    value={team.teamLeaderId ?? ""}
                    onChange={(e) =>
                      handleAssignLeader(team.id, e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-black"
                  >
                    <option value="">
                      {team.teamLeader ? "Change leader..." : "Assign leader..."}
                    </option>

                    {leaders.map((leader) => (
                      <option key={leader.id} value={leader.id}>
                        {leader.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Members */}
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Members
                  </p>

                  {team.members.length === 0 ? (
                    <p className="text-sm text-neutral-400">No members yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {team.members.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span
                            className={
                              member.isActive
                                ? "text-neutral-700"
                                : "text-neutral-400 line-through"
                            }
                          >
                            {member.name}
                          </span>

                          {member.id === team.teamLeaderId && (
                            <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-800">
                              TL
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Team Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#111111]">
                  {editingTeam ? "Edit Team" : "Create Team"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {editingTeam
                    ? "Update the team name or description."
                    : "Add a new department or team."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-xl text-neutral-400 hover:text-black"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Team name"
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

              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#111111] text-sm font-bold text-white hover:bg-[#242424]"
              >
                {editingTeam ? "Save Changes" : "Create Team"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teams;