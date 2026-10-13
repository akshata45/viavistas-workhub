import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
} from "../../services/userService";

import { getTeams } from "../../services/teamService";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  teamId: "",
};

function AllEmployees() {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null); // null = adding
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showInactive, setShowInactive] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [usersData, teamsData] = await Promise.all([
        getUsers(),
        getTeams(),
      ]);

      setEmployees(usersData.users || []);
      setTeams(teamsData.teams || []);
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // The team (if any) that this person leads
  const getLedTeam = (employee) =>
    teams.find((team) => team.teamLeaderId === employee.id) || null;

  const openAdd = () => {
    setEditingEmployee(null);
    setForm(emptyForm);
    setModalError("");
    setShowModal(true);
  };

  const openEdit = (employee) => {
    setEditingEmployee(employee);
    setForm({
      name: employee.name,
      email: employee.email,
      password: "",
      role: employee.role,
      teamId: employee.teamId ? String(employee.teamId) : "",
    });
    setModalError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setForm(emptyForm);
    setModalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setModalError("");

      if (editingEmployee) {
        const changes = {
          name: form.name,
          email: form.email,
        };

        // The Director's role and team are fixed
        if (editingEmployee.role !== "DIRECTOR") {
          changes.role = form.role;
          changes.teamId = form.teamId ? Number(form.teamId) : null;
        }

        // Only send a password if a new one was typed
        if (form.password) {
          changes.password = form.password;
        }

        await updateUser(editingEmployee.id, changes);
      } else {
        await createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          teamId: form.teamId ? Number(form.teamId) : null,
        });
      }

      closeModal();
      await loadData();
    } catch (error) {
      setModalError(error.message || "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (employee) => {
    const ledTeam = getLedTeam(employee);

    const message = ledTeam
      ? `Deactivate ${employee.name}?\n\nThey lead "${ledTeam.name}". That team will have no leader until you assign a new one on the Teams page.`
      : `Are you sure you want to deactivate ${employee.name}?`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      setError("");
      await deactivateUser(employee.id);
      await loadData();
    } catch (error) {
      setError(error.message || "Unable to deactivate employee.");
    }
  };

  const handleReactivate = async (employee) => {
    const confirmed = window.confirm(
      `Reactivate ${employee.name}?\n\nThey will be able to log in again.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await updateUser(employee.id, { isActive: true });
      await loadData();
    } catch (error) {
      setError(error.message || "Unable to reactivate employee.");
    }
  };

  // Hide inactive employees unless the toggle is on
  const visibleEmployees = showInactive
    ? employees
    : employees.filter((employee) => employee.isActive);

  const inactiveCount = employees.filter(
    (employee) => !employee.isActive
  ).length;

  // Facts used inside the edit popup
  const editingIsDirector = editingEmployee?.role === "DIRECTOR";
  const editingLedTeam = editingEmployee ? getLedTeam(editingEmployee) : null;

  return (
    <div className="min-h-screen bg-[#f7f7f5] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              ViaVistas WorkHub
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#111111]">
              All Employees
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Manage employees, roles and team assignments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInactive((previous) => !previous)}
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-100"
            >
              {showInactive
                ? "Hide Inactive"
                : `Show Inactive (${inactiveCount})`}
            </button>

            <button
              onClick={openAdd}
              className="rounded-xl bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#242424]"
            >
              Add Employee
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500">
            Loading employees...
          </div>
        ) : visibleEmployees.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-[#111111]">
              No employees to show
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Create an employee, or use "Show Inactive" to see
              deactivated accounts.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-neutral-100 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Employee
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Role
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Team
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleEmployees.map((employee) => {
                    const ledTeam = getLedTeam(employee);

                    return (
                      <tr
                        key={employee.id}
                        className="border-b border-neutral-100 last:border-0"
                      >
                        <td className="px-6 py-5">
                          <div>
                            <p
                              className={`font-bold ${
                                employee.isActive
                                  ? "text-[#111111]"
                                  : "text-neutral-400"
                              }`}
                            >
                              {employee.name}
                            </p>

                            <p className="mt-1 text-sm text-neutral-500">
                              {employee.email}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700">
                            {employee.role}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-neutral-600">
                          {employee.team?.name || "Unassigned"}

                          {ledTeam && (
                            <span className="ml-2 rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-800">
                              LEADER
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              employee.isActive
                                ? "bg-lime-100 text-lime-800"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {employee.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => openEdit(employee)}
                              className="text-sm font-semibold text-neutral-600 hover:text-black"
                            >
                              Edit
                            </button>

                            {employee.isActive &&
                              employee.role !== "DIRECTOR" && (
                                <button
                                  onClick={() => handleDeactivate(employee)}
                                  className="text-sm font-semibold text-red-500 hover:text-red-700"
                                >
                                  Deactivate
                                </button>
                              )}

                            {!employee.isActive && (
                              <button
                                onClick={() => handleReactivate(employee)}
                                className="text-sm font-semibold text-lime-700 hover:text-lime-900"
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#111111]">
                  {editingEmployee ? "Edit Employee" : "Add Employee"}
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  {editingEmployee
                    ? "Update details, role, team or password."
                    : "Create a WorkHub account."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-xl text-neutral-400 hover:text-black"
              >
                ×
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {modalError}
              </div>
            )}

            {editingLedTeam && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {editingEmployee.name} leads "{editingLedTeam.name}". To change
                their role or team, assign a different leader to that team on
                the Teams page first.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                required
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              />

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Work email"
                required
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              />

              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={
                  editingEmployee
                    ? "New password (leave blank to keep current)"
                    : "Temporary password"
                }
                required={!editingEmployee}
                minLength={8}
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              />

              {!editingIsDirector && (
                <>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    disabled={Boolean(editingLedTeam)}
                    className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black disabled:bg-neutral-100 disabled:text-neutral-400"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="TL">Team Leader</option>
                  </select>

                  <select
                    name="teamId"
                    value={form.teamId}
                    onChange={handleChange}
                    disabled={Boolean(editingLedTeam)}
                    className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black disabled:bg-neutral-100 disabled:text-neutral-400"
                  >
                    <option value="">
                      {teams.length === 0
                        ? "No teams yet – create one first"
                        : editingEmployee
                        ? "No team"
                        : "Select team"}
                    </option>

                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {editingEmployee && !editingIsDirector && (
                <p className="text-xs text-neutral-500">
                  If you move someone to another team, their unfinished tasks
                  move with them. Approved tasks stay with the old team.
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="h-12 w-full rounded-xl bg-[#111111] text-sm font-bold text-white hover:bg-[#242424] disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingEmployee
                  ? "Save Changes"
                  : "Create Employee"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllEmployees;