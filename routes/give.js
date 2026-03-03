import express from "express";
import {
  givePage,
  adminGivePage,
  updateGive,
  createGive,
  editGivePage,
  deleteGive
} from "../controllers/giveController.js";

import { isLoggedIn } from "../middleware/authMiddleware.js";
import { isAdmin, isSuperAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public
router.get("/give", givePage);

// Admin

router.get("/admin/give", isLoggedIn, isSuperAdmin, adminGivePage);
router.post("/admin/give", isLoggedIn, isSuperAdmin, createGive);

router.get("/admin/give/edit/:slug", isLoggedIn, isSuperAdmin, editGivePage);
router.post("/admin/give/edit/:slug", isLoggedIn, isSuperAdmin, updateGive);
router.post("/admin/give/delete/:slug", isLoggedIn, isSuperAdmin,deleteGive);
export default router;
