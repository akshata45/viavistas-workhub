import { useEffect, useState } from "react";

import { getWinners, confirmWinner } from "../../services/pointsService";

const monthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

// Shows who is Employee of the Month for the month being viewed on the
// leaderboard. The Director can choose or change the winner here.
//
// month         the month on screen, for example "2026-10"
// currentMonth  this month, for example "2026-10"
// people        the ranked people for that month
// isDirector    true if the viewer can choose the winner
function EmployeeOfMonthPanel({ month, currentMonth, people, isDirector }) {
  const [winners, setWinners] = useState([]);
  const [showPast, setShowPast] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ userId: "", note: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadWinners = async () => {
    try {
      const data = await getWinners();
      setWinners(data.winners || []);
    } catch {
      // The panel simply shows no winners if they cannot load
    }
  };

  useEffect(() => {
    loadWinners();
  }, []);

  const winner = winners.find((item) => item.month === month);

  // Only people who earned points that month can win
  const candidates = people.filter((person) => person.points > 0);

  const isRunning = month >= currentMonth;

  const openModal = () => {
    setForm({
      userId: winner ? String(winner.user.id) : "",
      note: winner?.note || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await confirmWinner({
        month,
        userId: Number(form.userId),
        note: form.note,
      });

      setShowModal(false);
      await loadWinners();
    } catch (err) {
      setError(err.message || "Unable to save the winner.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`mb-6 rounded-2xl bg-white p-6 ${
        winner ? "border-l-4 border-[#c4dc47]" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Employee of the Month · {monthLabel(month)}
          </p>

          {winner ? (
            <>
              <p className="mt-2 text-2xl font-extrabold text-[#111111]">
                {winner.user.name}
              </p>

              <p className="mt-1 text-sm text-neutral-600">
                {winner.points} points
                {winner.teamName && ` · ${winner.teamName}`}
              </p>

              {winner.note && (
                <p className="mt-2 text-sm italic text-neutral-600">
                  “{winner.note}”
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-lg font-bold text-neutral-400">
              {isRunning ? "Not chosen yet" : "No winner was chosen"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isDirector && (
            <button
              onClick={openModal}
              disabled={candidates.length === 0}
              className="rounded-xl bg-[#c4dc47] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#b5cd3a] disabled:opacity-50"
            >
              {winner ? "Change winner" : "Choose winner"}
            </button>
          )}

          {winners.length > 0 && (
            <button
              onClick={() => setShowPast((previous) => !previous)}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-100"
            >
              {showPast ? "Hide past winners" : "Past winners"}
            </button>
          )}
        </div>
      </div>

      {isDirector && candidates.length === 0 && (
        <p className="mt-3 text-xs text-neutral-500">
          Nobody has points in this month, so there is no one to choose.
        </p>
      )}

      {showPast && (
        <div className="mt-5 divide-y divide-neutral-100 rounded-xl border border-neutral-100">
          {winners.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <p className="font-bold text-[#111111]">{item.user.name}</p>
                <p className="text-xs text-neutral-400">
                  {item.teamName || "No team"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-neutral-700">
                  {monthLabel(item.month)}
                </p>
                <p className="text-xs text-neutral-400">
                  {item.points} points
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Choose winner popup (Director only) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#111111]">
                  Employee of the Month
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {monthLabel(month)}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-xl text-neutral-400 hover:text-black"
              >
                ×
              </button>
            </div>

            {isRunning && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This month is still running, so points can still change. You
                can change the winner later.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                name="userId"
                value={form.userId}
                onChange={handleChange}
                required
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              >
                <option value="">Choose the winner...</option>

                {candidates.map((person) => (
                  <option key={person.userId} value={person.userId}>
                    #{person.rank} {person.name} · {person.points} pts
                    {person.team ? ` · ${person.team.name}` : ""}
                  </option>
                ))}
              </select>

              <input
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Why they won (optional)"
                maxLength={200}
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              />

              <p className="text-xs text-neutral-500">
                Everyone will see the winner on the leaderboard. Only people
                who earned points in this month can be chosen.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="h-12 w-full rounded-xl bg-[#111111] text-sm font-bold text-white hover:bg-[#242424] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save winner"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeOfMonthPanel;