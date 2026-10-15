import express from "express";

import { login, changePassword } from "../controllers/authController.js";
import { authenticateAllowingTemporaryPassword } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);

// Any logged-in person, including someone who must set a new password
router.patch(
  "/change-password",
  authenticateAllowingTemporaryPassword,
  changePassword
);

export default router;