import express from "express";

import {
  listTeams,
  getTeam,
  addTeam,
  editTeam,
  removeTeam,
  setTeamLeader,
} from "../controllers/teamController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authenticate, allowRoles("DIRECTOR"), listTeams);

router.get("/:id", authenticate, allowRoles("DIRECTOR"), getTeam);

router.post("/", authenticate, allowRoles("DIRECTOR"), addTeam);

router.patch("/:id", authenticate, allowRoles("DIRECTOR"), editTeam);

router.delete("/:id", authenticate, allowRoles("DIRECTOR"), removeTeam);

router.patch(
  "/:id/team-leader",
  authenticate,
  allowRoles("DIRECTOR"),
  setTeamLeader
);

export default router;