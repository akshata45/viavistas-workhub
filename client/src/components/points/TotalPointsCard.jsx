import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyPoints } from "../../services/pointsService";

// The highlighted "Total points" card. It reads the points history,
// so bonus points are included. Clicking it opens the full history.
function TotalPointsCard() {
  const navigate = useNavigate();

  const [points, setPoints] = useState(null);

  useEffect(() => {
    let active = true;

    getMyPoints()
      .then((data) => {
        if (active) setPoints(data.points);
      })
      .catch(() => {
        // The card simply shows a dash if the points cannot load
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <button
      onClick={() => navigate("/points")}
      className="rounded-2xl bg-[#c4dc47] p-6 text-left transition hover:brightness-95"
    >
      <p className="text-sm text-neutral-800">Total points</p>

      <p className="mt-3 text-3xl font-extrabold text-[#111111]">
        {points ? points.allTime : "–"}
      </p>

      <p className="mt-1 text-xs font-semibold text-neutral-700">
        {points ? `${points.month} this month · ` : ""}View history →
      </p>
    </button>
  );
}

export default TotalPointsCard;