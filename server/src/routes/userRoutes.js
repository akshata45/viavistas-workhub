import express from "express";

import {
  listUsers,
  getUser,
  addUser,
  editUser,
  disableUser,
} from "../controllers/userController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  allowRoles("DIRECTOR"),
  listUsers
);

router.get(
  "/:id",
  authenticate,
  allowRoles("DIRECTOR"),
  getUser
);

router.post(
  "/",
  authenticate,
  allowRoles("DIRECTOR"),
  addUser
);

router.patch(
  "/:id",
  authenticate,
  allowRoles("DIRECTOR"),
  editUser
);

router.patch(
  "/:id/deactivate",
  authenticate,
  allowRoles("DIRECTOR"),
  disableUser
);

export default router;