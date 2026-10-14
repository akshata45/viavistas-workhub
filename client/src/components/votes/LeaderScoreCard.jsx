import { useEffect, useState } from "react";

import { getMyScore } from "../../services/voteService";

function Box({ label, value, hint, highlight = false }) {
  return (
    <div
      className={`rounded-xl p-5 ${highlight ? "bg-[#c4dc47]" : "bg-neutral-50"}`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          highlight ? "text-neutral-700" : "text-neutral-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-[#111111]">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </div>
  );
}

// A Team Leader's own leadership score for this month.
// The employee rating stays hidden until enough people have voted,
// so a single vote can never be traced back to one person.
function LeaderScoreCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getMyScore()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load your score.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (!data.hasTeam) {
    return (
      <div className="mb-6 rounded-2xl bg-white p-6">
        <h2 className="text-lg font-extrabold text-[#111111]">
          Your leadership score
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          You are not leading a team yet. Your score appears once the Director
          makes you a Team Leader.
        </p>
      </div>
    );
  }

  const { votes } = data;

  return (
    <div className="mb-6 rounded-2xl bg-white p-6">
      <h2 className="text-lg font-extrabold text-[#111111]">
        Your leadership score
      </h2>
      <p className="mt-1 text-sm text-neutral-500">
        {data.teamName} · this month
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Box
          label="Team performance"
          value={`${data.teamScore}/100`}
          hint={`${data.teamAverage} points per member`}
        />

        <Box
          label="Employee rating"
          value={votes.visible ? `${Number(votes.average).toFixed(1)} ★` : "–"}
          hint={
            votes.visible
              ? `from ${votes.count} votes`
              : `${votes.count} of ${data.minVotes} votes needed to show`
          }
        />

        <Box
          label="Overall score"
          value={votes.visible ? `${data.total}/100` : "–"}
          hint={
            votes.visible
              ? data.rank
                ? `Rank #${data.rank} among Team Leaders`
                : "Not ranked yet"
              : "Shown once enough people have voted"
          }
          highlight
        />
      </div>

      {votes.visible && data.comments.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            What your team said (anonymous)
          </p>

          <ul className="mt-2 space-y-2">
            {data.comments.map((item, index) => (
              <li
                key={index}
                className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700"
              >
                <span className="mr-2 font-bold text-[#c4b800]">
                  {"★".repeat(item.rating)}
                </span>
                {item.comment}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-5 text-xs text-neutral-500">
        Score = {data.weights.team}% team performance + {data.weights.votes}%
        employee rating. Team performance compares your team's points per
        member with the best team this month.
      </p>
    </div>
  );
}

export default LeaderScoreCard;