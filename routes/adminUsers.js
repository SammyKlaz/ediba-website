// import { userSuggestions } from "../controllers/adminUserController.js";

import express from "express";
import {
  adminUsersPage,
  updateUserRole,
  toggleUserStatus
} from "../controllers/adminUserController.js";

import { isLoggedIn } from "../middleware/authMiddleware.js";
import { isSuperAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get(
  "/admin/users",
  isLoggedIn,
  isSuperAdmin,
  adminUsersPage
);

router.post(
  "/admin/users/:id/role",
  isLoggedIn,
  isSuperAdmin,
  updateUserRole
);

router.post(
  "/admin/users/:id/toggle",
  isLoggedIn,
  isSuperAdmin,
  toggleUserStatus
);

export default router;
