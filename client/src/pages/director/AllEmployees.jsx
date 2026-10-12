import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
} from "../../services/userService";

import { getTeams } from "../../services/teamService";

function AllEmployees() {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    teamId: "",
  });

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

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        teamId: form.teamId ? Number(form.teamId) : null,
      });

      setForm({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
        teamId: "",
      });

      setShowModal(false);

      await loadData();
    } catch (error) {
      setError(error.message || "Unable to create employee.");
    }
  };

  const handleDeactivate = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this employee?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deactivateUser(id);
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
              onClick={() => setShowModal(true)}
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
                  {visibleEmployees.map((employee) => (
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
                        {employee.isActive &&
                          employee.role !== "DIRECTOR" && (
                            <button
                              onClick={() => handleDeactivate(employee.id)}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#111111]">
                  Add Employee
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Create a WorkHub account.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-xl text-neutral-400 hover:text-black"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
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
                placeholder="Temporary password"
                required
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              />

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="TL">Team Leader</option>
              </select>

              <select
                name="teamId"
                value={form.teamId}
                onChange={handleChange}
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              >
                <option value="">
                  {teams.length === 0
                    ? "No teams yet – create one first"
                    : "Select team"}
                </option>

                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#111111] text-sm font-bold text-white hover:bg-[#242424]"
              >
                Create Employee
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllEmployees;