
import express from "express";
import { getDirectorDashboard } from "../controllers/directorController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  allowRoles("DIRECTOR"),
  getDirectorDashboard
);

export default router;
