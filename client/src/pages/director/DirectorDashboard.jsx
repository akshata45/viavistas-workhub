function DirectorDashboard() {
  const user = JSON.parse(
    localStorage.getItem("workhubUser") || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem("workhubToken");
    localStorage.removeItem("workhubUser");

    window.location.href = "/";
  };

  return (
    <main className="min-h-screen bg-[#111111] p-4 md:p-6">
      <div className="min-h-[calc(100vh-2rem)] rounded-[28px] bg-[#f7f7f5] p-6 md:p-10">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              ViaVistas WorkHub
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#111111] md:text-4xl">
              Director Dashboard
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Welcome back, {user?.name}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#242424]"
          >
            Logout
          </button>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl bg-white p-6">
            <p className="text-sm text-neutral-400">
              Employees
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-[#111111]">
              0
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6">
            <p className="text-sm text-neutral-400">
              Pending Work
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-[#111111]">
              0
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6">
            <p className="text-sm text-neutral-400">
              Completed
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-[#111111]">
              0
            </h2>
          </div>

          <div className="rounded-2xl bg-[#C3D82D] p-6">
            <p className="text-sm font-medium text-[#111111]/60">
              Employee of Month
            </p>

            <h2 className="mt-3 text-2xl font-extrabold text-[#111111]">
              Coming Soon
            </h2>
          </div>

        </div>

        <div className="mt-6 rounded-2xl bg-[#111111] p-6 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            Logged in account
          </p>

          <p className="mt-2 text-lg font-semibold">
            {user?.email}
          </p>

          <span className="mt-3 inline-block rounded-full bg-[#C3D82D] px-3 py-1 text-xs font-bold text-[#111111]">
            {user?.role}
          </span>
        </div>

      </div>
    </main>
  );
}

export default DirectorDashboard;