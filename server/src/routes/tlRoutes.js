import express from "express";

import { myTeam } from "../controllers/tlController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Team Leader's own team and members
router.get("/team", authenticate, allowRoles("TL"), myTeam);

export default router;