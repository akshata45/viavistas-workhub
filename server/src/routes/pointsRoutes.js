import express from "express";

import {
  leaderboard,
  myPoints,
  giveBonus,
} from "../controllers/pointsController.js";

import { winners, chooseWinner } from "../controllers/winnerController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Everyone who is logged in can see the leaderboard
router.get("/leaderboard", authenticate, leaderboard);

// Employees and Team Leaders see their own points and history
router.get("/me", authenticate, allowRoles("EMPLOYEE", "TL"), myPoints);

// Only the Director can give bonus points or make corrections
router.post("/bonus", authenticate, allowRoles("DIRECTOR"), giveBonus);

// Everyone can see who won Employee of the Month
router.get("/winners", authenticate, winners);

// Only the Director chooses the winner
router.post("/winner", authenticate, allowRoles("DIRECTOR"), chooseWinner);

export default router;