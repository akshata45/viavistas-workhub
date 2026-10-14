import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyPoints } from "../../services/pointsService";
import { getUser } from "../../utils/auth";

const HOME = {
  DIRECTOR: "/director",
  TL: "/tl",
  EMPLOYEE: "/dashboard",
};

const TYPE_LABELS = {
  TASK_APPROVAL: "Task",
  BONUS: "Bonus",
  ADJUSTMENT: "Adjustment",
};

const TYPE_STYLES = {
  TASK_APPROVAL: "bg-lime-100 text-lime-800",
  BONUS: "bg-sky-100 text-sky-700",
  ADJUSTMENT: "bg-amber-100 text-amber-800",
};

const monthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function StatCard({ label, value, hint, highlight = false }) {
  return (
    <div
      className={`rounded-2xl p-6 ${highlight ? "bg-[#c4dc47]" : "bg-white"}`}
    >
      <p
        className={`text-sm ${
          highlight ? "text-neutral-800" : "text-neutral-500"
        }`}
      >
        {label}
      </p>
      <p className="mt-3 text-3xl font-extrabold text-[#111111]">{value}</p>
      {hint && (
        <p className="mt-1 text-xs font-semibold text-neutral-500">{hint}</p>
      )}
    </div>
  );
}

function MyPoints() {
  const navigate = useNavigate();

  const user = getUser();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        setData(await getMyPoints());
      } catch (err) {
        setError(err.message || "Unable to load your points.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const points = data?.points;

  return (
    <div className="min-h-screen bg-[#f7f7f5] p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(HOME[user?.role] || "/")}
              className="text-xs font-semibold text-neutral-400 hover:text-black"
            >
              ← Back to dashboard
            </button>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              ViaVistas WorkHub
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#111111]">
              My Points
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Every point you have earned, and why.
            </p>
          </div>

          <button
            onClick={() => navigate("/leaderboard")}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-100"
          >
            Leaderboard
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500">
            Loading your points...
          </div>
        ) : (
          data && (
            <>
              {/* Totals */}
              <div className="mb-8 grid gap-4 md:grid-cols-3">
                <StatCard
                  label="This month"
                  value={points.month}
                  hint={monthLabel(points.monthKey)}
                  highlight
                />
                <StatCard label="All time" value={points.allTime} />
                <StatCard
                  label="Rank this month"
                  value={points.rank ? `#${points.rank}` : "–"}
                  hint={
                    points.rank
                      ? `out of ${points.outOf} people`
                      : "Earn points to get ranked"
                  }
                />
              </div>

              {/* History */}
              <h2 className="mb-3 text-lg font-extrabold text-[#111111]">
                Points history
              </h2>

              {data.history.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center">
                  <h3 className="text-lg font-bold text-[#111111]">
                    No points yet
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    When your work is approved, the points show up here.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-white">
                  {data.history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 border-b border-neutral-100 px-6 py-4 last:border-0"
                    >
                      <div>
                        <p className="font-bold text-[#111111]">
                          {item.reason}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              TYPE_STYLES[item.type]
                            }`}
                          >
                            {TYPE_LABELS[item.type]}
                          </span>

                          <span>{formatDateTime(item.createdAt)}</span>

                          {item.awardedBy && <span>· by {item.awardedBy.name}</span>}
                        </div>
                      </div>

                      <p
                        className={`text-xl font-extrabold ${
                          item.points >= 0 ? "text-lime-700" : "text-red-600"
                        }`}
                      >
                        {item.points > 0 ? "+" : ""}
                        {item.points}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {data.history.length === 100 && (
                <p className="mt-3 text-xs text-neutral-500">
                  Showing your 100 most recent entries.
                </p>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

export default MyPoints;