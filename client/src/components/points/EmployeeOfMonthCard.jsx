import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getWinners } from "../../services/pointsService";

const monthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

// Dashboard card showing the most recent Employee of the Month.
// Clicking it opens the leaderboard, where the winner is chosen.
function EmployeeOfMonthCard() {
  const navigate = useNavigate();

  const [winner, setWinner] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    getWinners()
      .then((data) => {
        if (!active) return;

        setWinner((data.winners || [])[0] || null);
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <button
      onClick={() => navigate("/leaderboard")}
      className="rounded-2xl bg-[#C3D82D] p-6 text-left transition hover:brightness-95"
    >
      <p className="text-sm font-medium text-[#111111]/60">
        Employee of Month
      </p>

      <h2 className="mt-3 text-2xl font-extrabold text-[#111111]">
        {winner ? winner.user.name : loaded ? "Not chosen yet" : "..."}
      </h2>

      <p className="mt-3 text-xs font-semibold text-[#111111]/60">
        {winner
          ? `${monthLabel(winner.month)} · ${winner.points} points`
          : "Choose on the leaderboard →"}
      </p>
    </button>
  );
}

export default EmployeeOfMonthCard;