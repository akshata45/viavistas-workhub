import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DirectorDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    employees: 0,
    pendingWork: 0,
    completed: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD LOGGED IN USER
  // --------------------------------------------------

  useEffect(() => {
    const storedUser = localStorage.getItem("workhubUser");

    if (!storedUser) {
      navigate("/", { replace: true });
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      setUser(parsedUser);

      if (parsedUser.role !== "DIRECTOR") {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Unable to read logged in user:", error);

      localStorage.removeItem("workhubUser");
      localStorage.removeItem("workhubToken");

      navigate("/", { replace: true });
    }
  }, [navigate]);

  // --------------------------------------------------
  // LOAD DASHBOARD STATISTICS
  // --------------------------------------------------

  useEffect(() => {
    const loadDashboardStats = async () => {
      const token = localStorage.getItem("workhubToken");

      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");

        /*
          This endpoint will be connected to the backend
          in the next step.

          Until then, the dashboard safely remains at 0.
        */

        const response = await fetch(
          "http://localhost:5000/api/director/dashboard",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load dashboard data.");
        }

        const data = await response.json();

        if (data.success && data.stats) {
          setStats({
            employees: data.stats.employees ?? 0,
            pendingWork: data.stats.pendingWork ?? 0,
            completed: data.stats.completed ?? 0,
          });
        }
      } catch (error) {
        console.error("Dashboard error:", error);

        /*
          We don't break the dashboard if the statistics
          endpoint has not been created yet.
        */

        setStats({
          employees: 0,
          pendingWork: 0,
          completed: 0,
        });

        setError("");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardStats();
    }
  }, [user, navigate]);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("workhubToken");
    localStorage.removeItem("workhubUser");

    navigate("/", { replace: true });
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#111111]">
        <div className="text-sm text-white">
          Loading WorkHub...
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#111111] p-4 md:p-6">
      <div className="min-h-[calc(100vh-2rem)] rounded-[28px] bg-[#f7f7f5] p-6 md:p-10">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              ViaVistas WorkHub
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#111111] md:text-4xl">
              Director Dashboard
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Welcome back, {user.name}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-fit rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#242424]"
          >
            Logout
          </button>

        </div>

        {/* ==========================================
            DASHBOARD STATISTICS
        ========================================== */}

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

          {/* EMPLOYEES */}

          <button
            type="button"
            onClick={() => navigate("/director/employees")}
            className="rounded-2xl bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm text-neutral-400">
              Employees
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-[#111111]">
              {loading ? "..." : stats.employees}
            </h2>

            <p className="mt-3 text-xs font-semibold text-neutral-400">
              Manage employees →
            </p>
          </button>


          {/* PENDING WORK */}

          <button
            type="button"
            onClick={() => navigate("/director/tasks")}
            className="rounded-2xl bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm text-neutral-400">
              Pending Work
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-[#111111]">
              {loading ? "..." : stats.pendingWork}
            </h2>

            <p className="mt-3 text-xs font-semibold text-neutral-400">
              View work →
            </p>
          </button>


          {/* COMPLETED */}

          <button
            type="button"
            onClick={() => navigate("/director/tasks")}
            className="rounded-2xl bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm text-neutral-400">
              Completed
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-[#111111]">
              {loading ? "..." : stats.completed}
            </h2>

            <p className="mt-3 text-xs font-semibold text-neutral-400">
              View completed →
            </p>
          </button>


          {/* EMPLOYEE OF MONTH */}

          <div className="rounded-2xl bg-[#C3D82D] p-6">

            <p className="text-sm font-medium text-[#111111]/60">
              Employee of Month
            </p>

            <h2 className="mt-3 text-2xl font-extrabold text-[#111111]">
              Coming Soon
            </h2>

            <p className="mt-3 text-xs font-semibold text-[#111111]/60">
              Performance system
            </p>

          </div>

        </div>


        {/* ==========================================
            QUICK ACTIONS
        ========================================== */}

        <section className="mt-8">

          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Management
            </p>

            <h2 className="mt-1 text-xl font-bold text-[#111111]">
              Quick Actions
            </h2>
          </div>


          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* EMPLOYEES */}

            <button
              type="button"
              onClick={() => navigate("/director/employees")}
              className="rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-[#111111] hover:shadow-md"
            >
              <p className="text-sm font-bold text-[#111111]">
                Employees
              </p>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                View, add and manage ViaVistas employees.
              </p>
            </button>


            {/* TEAMS */}

            <button
              type="button"
              onClick={() => navigate("/director/teams")}
              className="rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-[#111111] hover:shadow-md"
            >
              <p className="text-sm font-bold text-[#111111]">
                Teams
              </p>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Manage departments and team leaders.
              </p>
            </button>


            {/* TASKS */}

            <button
              type="button"
              onClick={() => navigate("/director/tasks")}
              className="rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-[#111111] hover:shadow-md"
            >
              <p className="text-sm font-bold text-[#111111]">
                Work & Tasks
              </p>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Monitor assigned and submitted work.
              </p>
            </button>


            {/* PERFORMANCE */}

            <button
              type="button"
              onClick={() => navigate("/director/performance")}
              className="rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-[#111111] hover:shadow-md"
            >
              <p className="text-sm font-bold text-[#111111]">
                Performance
              </p>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Track team performance and contribution.
              </p>
            </button>

          </div>

        </section>


        {/* ==========================================
            LOGGED IN ACCOUNT
        ========================================== */}

        <div className="mt-8 rounded-2xl bg-[#111111] p-6 text-white">

          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            Logged in account
          </p>

          <p className="mt-2 text-lg font-semibold">
            {user.email}
          </p>

          <span className="mt-3 inline-block rounded-full bg-[#C3D82D] px-3 py-1 text-xs font-bold text-[#111111]">
            {user.role}
          </span>

        </div>


        {/* ==========================================
            SYSTEM STATUS
        ========================================== */}

        <div className="mt-5 flex flex-col gap-2 text-xs text-neutral-400 md:flex-row md:items-center md:justify-between">

          <span>
            ViaVistas WorkHub • Internal Management System
          </span>

          <span>
            System Online
          </span>

        </div>

      </div>
    </main>
  );
}

export default DirectorDashboard;