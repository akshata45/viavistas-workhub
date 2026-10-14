import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getLeaderScores } from "../../services/voteService";

// "2026-10" -> "October 2026"
const monthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const shiftMonth = (key, amount) => {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const stars = (value) => {
  const filled = Math.round(value);

  return "★".repeat(filled) + "☆".repeat(5 - filled);
};

function RankBadge({ rank }) {
  if (rank === null) {
    return <span className="text-neutral-300">–</span>;
  }

  const style =
    rank === 1
      ? "bg-[#c4dc47] text-black"
      : rank === 2
      ? "bg-neutral-300 text-neutral-800"
      : rank === 3
      ? "bg-amber-200 text-amber-900"
      : "bg-neutral-100 text-neutral-600";

  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${style}`}
    >
      {rank}
    </span>
  );
}

// Director only: how every Team Leader is doing this month
function LeaderScores() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  // Leave monthKey empty to load the current month
  const load = async (monthKey = "") => {
    try {
      setLoading(true);
      setError("");
      setOpenId(null);

      setData(await getLeaderScores(monthKey));
    } catch (err) {
      setError(err.message || "Unable to load the Team Leader scores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isCurrentMonth = data ? data.month >= data.currentMonth : true;

  return (
    <div className="min-h-screen bg-[#f7f7f5] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
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
              Team Leader Scores
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              How each Team Leader's team is performing, and how their team
              rates them.
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

        {/* Month switcher */}
        {data && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-white px-5 py-3">
            <button
              onClick={() => load(shiftMonth(data.month, -1))}
              className="rounded-lg px-3 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100"
            >
              ← Previous
            </button>

            <div className="text-center">
              <p className="text-lg font-extrabold text-[#111111]">
                {monthLabel(data.month)}
              </p>

              {!isCurrentMonth && (
                <button
                  onClick={() => load()}
                  className="text-xs font-semibold text-neutral-500 underline hover:text-black"
                >
                  Back to this month
                </button>
              )}
            </div>

            <button
              onClick={() => load(shiftMonth(data.month, 1))}
              disabled={isCurrentMonth}
              className="rounded-lg px-3 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}

        {loading && !data ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500">
            Loading scores...
          </div>
        ) : (
          data &&
          (data.leaders.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center">
              <h2 className="text-lg font-bold text-[#111111]">
                No Team Leaders yet
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Assign a Team Leader to a team on the Teams page.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-neutral-100 text-left">
                        {[
                          "Rank",
                          "Team Leader",
                          "Team performance",
                          "Employee rating",
                          "Score",
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
                      {data.leaders.map((leader) => (
                        <FragmentRow
                          key={leader.tlId}
                          leader={leader}
                          open={openId === leader.tlId}
                          onToggle={() =>
                            setOpenId(openId === leader.tlId ? null : leader.tlId)
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-xs text-neutral-500">
                <p>
                  Score = {data.weights.team}% team performance +{" "}
                  {data.weights.votes}% employee rating. Team performance
                  compares a team's points per member with the best team that
                  month.
                </p>
                <p>
                  A Team Leader with no votes yet is scored on team
                  performance alone. Team Leaders only see their rating once{" "}
                  {data.minVotes} people have voted, and never see who voted.
                </p>
                <p>Click a row to read the individual ratings and comments.</p>
              </div>
            </>
          ))
        )}
      </div>
    </div>
  );
}

function FragmentRow({ leader, open, onToggle }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50"
      >
        <td className="px-6 py-4">
          <RankBadge rank={leader.rank} />
        </td>

        <td className="px-6 py-4">
          <p className="font-bold text-[#111111]">{leader.name}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {leader.teamName} · {leader.members} member
            {leader.members === 1 ? "" : "s"}
          </p>
        </td>

        <td className="px-6 py-4">
          <p className="text-sm font-semibold text-neutral-800">
            {leader.teamScore}/100
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {leader.teamAverage} points per member
          </p>
        </td>

        <td className="px-6 py-4">
          {leader.voteCount === 0 ? (
            <p className="text-sm text-neutral-400">No votes yet</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-[#8a8000]">
                {stars(leader.voteAverage)}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {leader.voteAverage} from {leader.voteCount} vote
                {leader.voteCount === 1 ? "" : "s"}
              </p>
            </>
          )}
        </td>

        <td className="px-6 py-4 text-lg font-extrabold text-[#111111]">
          {leader.total}
        </td>
      </tr>

      {open && (
        <tr className="border-b border-neutral-100 bg-neutral-50">
          <td colSpan={5} className="px-6 py-4">
            {leader.comments.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No ratings yet. The score uses team performance only.
              </p>
            ) : (
              <ul className="space-y-2">
                {leader.comments.map((item, index) => (
                  <li
                    key={index}
                    className="rounded-xl bg-white px-4 py-3 text-sm text-neutral-700"
                  >
                    <span className="mr-2 font-bold text-[#8a8000]">
                      {"★".repeat(item.rating)}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {item.voterName}
                    </span>
                    {item.comment && (
                      <span className="text-neutral-600"> — {item.comment}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default LeaderScores;