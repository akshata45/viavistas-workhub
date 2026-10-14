import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getLeaderboard, awardBonus } from "../../services/pointsService";
import EmployeeOfMonthPanel from "../../components/points/EmployeeOfMonthPanel";
import { getUser } from "../../utils/auth";

const HOME = {
  DIRECTOR: "/director",
  TL: "/tl",
  EMPLOYEE: "/dashboard",
};

// "2026-10" -> "October 2026"
const monthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

// Move a "2026-10" key forward or back by whole months
const shiftMonth = (key, amount) => {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

const emptyBonus = { userId: "", points: "", reason: "" };

function Leaderboard() {
  const navigate = useNavigate();

  const user = getUser();
  const isDirector = user?.role === "DIRECTOR";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [tab, setTab] = useState("PEOPLE");

  // Bonus popup (Director only)
  const [showBonus, setShowBonus] = useState(false);
  const [bonusForm, setBonusForm] = useState(emptyBonus);
  const [bonusError, setBonusError] = useState("");
  const [saving, setSaving] = useState(false);

  // Leave monthKey empty to load the current month
  const load = async (monthKey = "") => {
    try {
      setLoading(true);
      setError("");

      const result = await getLeaderboard(monthKey);

      setData(result);
    } catch (err) {
      setError(err.message || "Unable to load the leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const goHome = () => navigate(HOME[user?.role] || "/");

  const isCurrentMonth = data ? data.month >= data.currentMonth : true;

  const topPerson = data?.people.find((person) => person.rank === 1);
  const topTeam = data?.teams.find((team) => team.rank === 1);

  // The login only stores basic details, so find my team from the list
  const myTeamId = data?.people.find((person) => person.userId === user?.id)
    ?.team?.id;

  // --------------------------------------------------
  // BONUS POINTS
  // --------------------------------------------------

  const openBonus = () => {
    setBonusForm(emptyBonus);
    setBonusError("");
    setShowBonus(true);
  };

  const handleBonusChange = (e) => {
    const { name, value } = e.target;
    setBonusForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleBonusSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setBonusError("");

      const result = await awardBonus({
        userId: Number(bonusForm.userId),
        points: Number(bonusForm.points),
        reason: bonusForm.reason,
      });

      const given = result.transaction;

      setShowBonus(false);
      setNotice(
        `Recorded ${given.points > 0 ? "+" : ""}${given.points} points for ${
          given.user.name
        }.`
      );

      // Points count toward the current month
      await load();
    } catch (err) {
      setBonusError(err.message || "Unable to record points.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              onClick={goHome}
              className="text-xs font-semibold text-neutral-400 hover:text-black"
            >
              ← Back to dashboard
            </button>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              ViaVistas WorkHub
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#111111]">
              Leaderboard
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Points are earned when approved work is completed.
            </p>
          </div>

          {isDirector && (
            <button
              onClick={openBonus}
              disabled={!data}
              className="rounded-xl bg-[#c4dc47] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#b5cd3a] disabled:opacity-50"
            >
              Award points
            </button>
          )}
        </div>

        {notice && (
          <div className="mb-5 rounded-xl border border-lime-300 bg-lime-50 px-4 py-3 text-sm font-semibold text-lime-800">
            {notice}
          </div>
        )}

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

        {/* Employee of the Month */}
        {data && (
          <EmployeeOfMonthPanel
            month={data.month}
            currentMonth={data.currentMonth}
            people={data.people}
            isDirector={isDirector}
          />
        )}

        {loading && !data ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500">
            Loading leaderboard...
          </div>
        ) : (
          data && (
            <>
              {/* Leaders */}
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#c4dc47] p-6">
                  <p className="text-sm text-neutral-800">Top performer</p>

                  {topPerson ? (
                    <>
                      <p className="mt-2 text-2xl font-extrabold text-[#111111]">
                        {topPerson.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-700">
                        {topPerson.points} points
                        {topPerson.team && ` · ${topPerson.team.name}`}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-lg font-bold text-neutral-700">
                      No points yet this month
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-6">
                  <p className="text-sm text-neutral-500">Top team</p>

                  {topTeam ? (
                    <>
                      <p className="mt-2 text-2xl font-extrabold text-[#111111]">
                        {topTeam.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-600">
                        {topTeam.average} points per member ·{" "}
                        {topTeam.points} total
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-lg font-bold text-neutral-400">
                      No team points yet
                    </p>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-5 flex gap-2">
                {[
                  ["PEOPLE", "People"],
                  ["TEAMS", "Teams"],
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

              {/* PEOPLE */}
              {tab === "PEOPLE" &&
                (data.people.length === 0 ? (
                  <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500">
                    No employees yet.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr className="border-b border-neutral-100 text-left">
                            {["Rank", "Name", "Team", "Tasks", "Points"].map(
                              (heading) => (
                                <th
                                  key={heading}
                                  className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-400"
                                >
                                  {heading}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {data.people.map((person) => {
                            const isMe = person.userId === user?.id;

                            return (
                              <tr
                                key={person.userId}
                                className={`border-b border-neutral-100 last:border-0 ${
                                  isMe ? "bg-lime-50" : ""
                                }`}
                              >
                                <td className="px-6 py-4">
                                  <RankBadge rank={person.rank} />
                                </td>

                                <td className="px-6 py-4">
                                  <span className="font-bold text-[#111111]">
                                    {person.name}
                                  </span>

                                  {isMe && (
                                    <span className="ml-2 rounded-full bg-[#c4dc47] px-2 py-0.5 text-[10px] font-bold text-black">
                                      YOU
                                    </span>
                                  )}

                                  {person.role === "TL" && (
                                    <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                                      TL
                                    </span>
                                  )}
                                </td>

                                <td className="px-6 py-4 text-sm text-neutral-600">
                                  {person.team?.name || "—"}
                                </td>

                                <td className="px-6 py-4 text-sm text-neutral-600">
                                  {person.tasksApproved}
                                </td>

                                <td className="px-6 py-4 text-sm font-extrabold text-[#111111]">
                                  {person.points}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

              {/* TEAMS */}
              {tab === "TEAMS" &&
                (data.teams.length === 0 ? (
                  <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500">
                    No teams yet.
                  </div>
                ) : (
                  <>
                    <div className="overflow-hidden rounded-2xl bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead>
                            <tr className="border-b border-neutral-100 text-left">
                              {[
                                "Rank",
                                "Team",
                                "Leader",
                                "Members",
                                "Total",
                                "Per member",
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
                            {data.teams.map((team) => {
                              const isMine = team.teamId === myTeamId;

                              return (
                                <tr
                                  key={team.teamId}
                                  className={`border-b border-neutral-100 last:border-0 ${
                                    isMine ? "bg-lime-50" : ""
                                  }`}
                                >
                                  <td className="px-6 py-4">
                                    <RankBadge rank={team.rank} />
                                  </td>

                                  <td className="px-6 py-4 font-bold text-[#111111]">
                                    {team.name}
                                  </td>

                                  <td className="px-6 py-4 text-sm text-neutral-600">
                                    {team.leader || "—"}
                                  </td>

                                  <td className="px-6 py-4 text-sm text-neutral-600">
                                    {team.members}
                                  </td>

                                  <td className="px-6 py-4 text-sm text-neutral-600">
                                    {team.points}
                                  </td>

                                  <td className="px-6 py-4 text-sm font-extrabold text-[#111111]">
                                    {team.average}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-neutral-500">
                      Teams are ranked by points per member, so smaller teams
                      compete fairly with larger ones.
                    </p>
                  </>
                ))}
            </>
          )
        )}
      </div>

      {/* Award points popup (Director only) */}
      {showBonus && data && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#111111]">
                  Award Points
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Give bonus points, or use a negative number to correct a
                  mistake.
                </p>
              </div>

              <button
                onClick={() => setShowBonus(false)}
                className="text-xl text-neutral-400 hover:text-black"
              >
                ×
              </button>
            </div>

            {bonusError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {bonusError}
              </div>
            )}

            <form onSubmit={handleBonusSubmit} className="space-y-4">
              <select
                name="userId"
                value={bonusForm.userId}
                onChange={handleBonusChange}
                required
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              >
                <option value="">Who receives the points...</option>

                {[...data.people]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((person) => (
                    <option key={person.userId} value={person.userId}>
                      {person.name}
                      {person.team ? ` · ${person.team.name}` : ""}
                    </option>
                  ))}
              </select>

              <input
                name="points"
                type="number"
                min="-500"
                max="500"
                step="1"
                value={bonusForm.points}
                onChange={handleBonusChange}
                placeholder="Points (for example 10, or -5 to correct)"
                required
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              />

              <input
                name="reason"
                value={bonusForm.reason}
                onChange={handleBonusChange}
                placeholder="Reason (shown in their history)"
                maxLength={200}
                required
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
              />

              <p className="text-xs text-neutral-500">
                These points are added to the current month, and the person
                will see the reason in their points history.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="h-12 w-full rounded-xl bg-[#111111] text-sm font-bold text-white hover:bg-[#242424] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Record points"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;