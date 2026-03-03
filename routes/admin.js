import express from "express";
import { uploadEvent, uploadSermonVideo, uploadMinister, uploadBirthday, uploadEventMedia } from "../config/multer.js";
import { adminDashboard, adminEvents, adminSermons } from "../controllers/adminController.js";
import { createEvent } from "../controllers/eventController.js";
import { toggleComments, toggleSermonComments } from "../controllers/adminController.js";
import { isAdmin, isSuperAdmin } from "../middleware/adminMiddleware.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import { deleteEvent, editEventPage, updateEvent } from "../controllers/adminController.js";
import { createSermon } from "../controllers/adminController.js";
import { deleteSermon, editSermonPage, updateSermon } from "../controllers/adminController.js";
import { addEventMedia, deleteEventMedia } from "../controllers/adminController.js";

import {
  adminAboutPage,
  updateMembership,
  createMinister,
  toggleMinisterStatus,
  setMinisterInCharge,
  adminEditMinisterPage,
  updateMinister,
  deleteMinister
} from "../controllers/adminController.js";

import {
  birthdaysPage,
  createBirthdayPage,
  createBirthday,
  editBirthdayPage,
  updateBirthday,
  deleteBirthday
} from "../controllers/birthdayController.js";


const router = express.Router();

router.get("/admin", isAdmin, adminDashboard);
router.get("/admin/events", isAdmin, adminEvents);
router.get("/admin/sermons", isAdmin, adminSermons);

// handle event creation with flyer upload
router.post("/admin/events", isAdmin, uploadEvent.single("flyer"), createEvent);
router.post("/admin/events/:slug/toggle-comments", isAdmin, toggleComments);
router.post("/admin/events/:slug/delete", isAdmin, deleteEvent);
router.get("/admin/events/:slug/edit", isAdmin, editEventPage);
router.post("/admin/events/:slug/edit", isAdmin, uploadEvent.single("flyer"), updateEvent);
router.post("/admin/sermons", isAdmin, uploadSermonVideo.single("video"), createSermon);
router.post("/admin/sermons/:slug/toggleSermonComments", isAdmin, toggleSermonComments);
router.post("/admin/sermons/:slug/delete", isAdmin, deleteSermon);
router.get("/admin/sermons/:slug/edit", isAdmin, editSermonPage);
router.post("/admin/sermons/:slug/edit", isAdmin,  uploadSermonVideo.single("video"), updateSermon);

router.get("/admin/about", isSuperAdmin, adminAboutPage);

router.post("/admin/about/membership", isSuperAdmin, updateMembership);

router.post("/admin/ministers/create", isSuperAdmin, uploadMinister.single("photo"), createMinister);

router.post("/admin/ministers/:id/toggle", isSuperAdmin, toggleMinisterStatus);

router.post("/admin/ministers/:id/set-in-charge", isSuperAdmin, setMinisterInCharge);

router.get("/admin/ministers/:slug/edit", isSuperAdmin, adminEditMinisterPage);
router.post("/admin/ministers/:slug/edit", isSuperAdmin, uploadMinister.single("photo"), updateMinister);

router.post("/admin/ministers/:slug/delete", isSuperAdmin, deleteMinister);
router.post("/admin/events/:eventId/media", uploadEventMedia.array("media", 10), isAdmin, isSuperAdmin, addEventMedia);
router.post("/admin/events/media/:id/delete",isAdmin, isSuperAdmin, deleteEventMedia);




/* List */
router.get(
  "/admin/birthdays",
  isLoggedIn,
  isAdmin,
  birthdaysPage
);

/* Create page */
router.get(
  "/admin/birthdays/create",
  isLoggedIn,
  isAdmin,
  (req, res) => {
    res.render("admin/create-birthday", { user: req.session.user });
  }
);

/* Create */
router.post(
  "/admin/birthdays",
  isLoggedIn,
  isAdmin,
  uploadBirthday.single("photo"),
  createBirthday
);

/* Edit page */
router.get(
  "/admin/birthdays/:id/edit",
  isLoggedIn,
  isAdmin,
  editBirthdayPage
);

/* Update */
router.post(
  "/admin/birthdays/:id/edit",
  isLoggedIn,
  isAdmin,
  uploadBirthday.single("photo"),
  updateBirthday
);

/* Delete */
router.post(
  "/admin/birthdays/:id/delete",
  isLoggedIn,
  isAdmin,
  deleteBirthday
);


//ADMIN RECEIPTS ROUTES
import {
  adminReceiptsPage,
  createReceiptPage,
  storeReceipt,
  editReceiptPage,
  updateReceipt,
  deleteReceipt
} from "../controllers/adminReceiptController.js";

import { receiptUpload } from "../config/multer.js";



/* RECEIPTS */
router.get("/admin/receipts/index", adminReceiptsPage);
router.get("/admin/receipts/create", createReceiptPage);
router.post(
  "/admin/receipts",
  receiptUpload.single("image"),
  storeReceipt
);

router.get("/admin/receipts/:id/edit", editReceiptPage);
router.post(
  "/admin/receipts/:id",
  receiptUpload.single("image"),
  updateReceipt
);

router.post("/admin/receipts/:id/delete", deleteReceipt);




export default router;
