import express from "express";

import { directorDashboard } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  allowRoles("DIRECTOR"),
  directorDashboard
);

export default router;