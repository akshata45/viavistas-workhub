import { useEffect, useState } from "react";

import { getMyVote, submitVote } from "../../services/voteService";
import { getUser } from "../../utils/auth";

const monthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

// Lets an employee rate their Team Leader from 1 to 5 stars, once a month.
// It shows nothing for anyone who is not an employee.
function RateLeaderCard() {
  const user = getUser();
  const isEmployee = user?.role === "EMPLOYEE";

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(isEmployee);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isEmployee) return undefined;

    let active = true;

    getMyVote()
      .then((data) => {
        if (!active) return;

        setInfo(data);
        setRating(data.vote?.rating || 0);
        setComment(data.vote?.comment || "");
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load your rating.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isEmployee]);

  if (!isEmployee || loading) {
    return null;
  }

  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  // No team, or the team has no Team Leader yet
  if (!info?.leader) {
    return (
      <div className="mb-6 rounded-2xl bg-white p-6">
        <h2 className="text-lg font-extrabold text-[#111111]">
          Rate your Team Leader
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {info?.team
            ? "Your team does not have a Team Leader yet."
            : "You are not in a team yet."}
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const result = await submitVote({ rating, comment });

      setInfo((previous) => ({ ...previous, vote: result.vote }));
      setSaved(true);
    } catch (err) {
      setError(err.message || "Unable to save your rating.");
    } finally {
      setSaving(false);
    }
  };

  const shown = hover || rating;

  return (
    <div className="mb-6 rounded-2xl bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#111111]">
            Rate your Team Leader
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {info.leader.name} · {monthLabel(info.month)}
          </p>
        </div>

        {info.vote && (
          <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-bold text-lime-800">
            You rated {info.vote.rating} of 5
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            onClick={() => {
              setRating(star);
              setSaved(false);
            }}
            onMouseEnter={() => setHover(star)}
            className={`text-4xl leading-none transition ${
              star <= shown ? "text-[#c4b800]" : "text-neutral-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <input
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
          setSaved(false);
        }}
        maxLength={300}
        placeholder="Add a comment (optional)"
        className="mt-4 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
      />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || rating === 0}
          className="rounded-xl bg-[#111111] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#242424] disabled:opacity-50"
        >
          {saving ? "Saving..." : info.vote ? "Update rating" : "Save rating"}
        </button>

        {saved && (
          <span className="text-sm font-semibold text-lime-700">
            Saved. You can change it until the month ends.
          </span>
        )}
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        Your Team Leader only sees the team's average rating, never who voted.
        Your Director can see individual ratings.
      </p>
    </div>
  );
}

export default RateLeaderCard;