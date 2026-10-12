import express from "express";

import {
  listTasks,
  getTask,
  addTask,
  editTask,
  setTaskStatus,
  reviewSubmittedTask,
  addComment,
} from "../controllers/taskController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Everyone logged in. The service decides what each role can see.
router.get("/", authenticate, listTasks);
router.get("/:id", authenticate, getTask);

// Create / edit: Director and Team Leaders only
router.post("/", authenticate, allowRoles("DIRECTOR", "TL"), addTask);
router.patch("/:id", authenticate, allowRoles("DIRECTOR", "TL"), editTask);

// Employee updates status (the service checks they own the task)
router.patch("/:id/status", authenticate, setTaskStatus);

// Approve / reject: Director and Team Leaders only
router.patch(
  "/:id/review",
  authenticate,
  allowRoles("DIRECTOR", "TL"),
  reviewSubmittedTask
);

// Comments: anyone who can see the task
router.post("/:id/comments", authenticate, addComment);

export default router;