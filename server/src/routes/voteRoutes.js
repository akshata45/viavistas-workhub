import express from "express";

import {
  myVote,
  castVote,
  myScore,
  leaderScores,
} from "../controllers/voteController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Employees: see and change their rating of their Team Leader
router.get("/my-vote", authenticate, allowRoles("EMPLOYEE"), myVote);
router.put("/", authenticate, allowRoles("EMPLOYEE"), castVote);

// Team Leaders: their own score (no names, and hidden until enough votes)
router.get("/my-score", authenticate, allowRoles("TL"), myScore);

// Director: every Team Leader's score, with comments
router.get("/leaders", authenticate, allowRoles("DIRECTOR"), leaderScores);

export default router;