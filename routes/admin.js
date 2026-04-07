import express from "express";
import { uploadEvent, uploadMinister, uploadBirthday, uploadEventMedia } from "../config/multer.js";
import { adminDashboard, adminEvents } from "../controllers/adminController.js";
import { createEvent } from "../controllers/eventController.js";
import { toggleComments } from "../controllers/adminController.js";
import { isAdmin, isSuperAdmin } from "../middleware/adminMiddleware.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import { deleteEvent, editEventPage, updateEvent } from "../controllers/adminController.js";
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


import { uploadContactPortrait } from "../config/multer.js";
import {
  adminMinistriesPage,
  newMinistryPage,
  createMinistry,
  editMinistryPage,
  updateMinistry,
  deleteMinistry,
  adminChurchContactsPage,
  newChurchContactPage,
  createChurchContact,
  editChurchContactPage,
  updateChurchContact,
  deleteChurchContact,
  adminMinistryContactsPage,
  newMinistryContactPage,
  createMinistryContact,
  editMinistryContactPage,
  updateMinistryContact,
  deleteMinistryContact
} from "../controllers/ministryAdminController.js";

const router = express.Router();

router.get("/admin", isAdmin, isSuperAdmin, adminDashboard);
router.get("/admin/events", isAdmin, isSuperAdmin, adminEvents);
// Sermons admin removed (replaced with Contacts/Get Involved)

// handle event creation with flyer upload
router.post(
  "/admin/events",
  isAdmin,
  (req, res, next) => {
    uploadEvent.single("flyer")(req, res, function (err) {
      if (err) {
        console.error("uploadEvent create error:", err);
        req.flash("error", err.message || "Flyer upload failed.");
        return res.redirect("/admin/events");
      }
      next();
    });
  },
  createEvent
);

router.post("/admin/events/:slug/toggle-comments", isAdmin, isSuperAdmin, toggleComments);
router.post("/admin/events/:slug/delete", isAdmin, isSuperAdmin, deleteEvent);
router.get("/admin/events/:slug/edit", isAdmin, isSuperAdmin, editEventPage);
router.post("/admin/events/:slug/edit", isAdmin, isSuperAdmin, (req, res, next) => {
  uploadEvent.single("flyer")(req, res, function (err) {
    if (err) {
      console.error("uploadEvent edit error:", err);
      req.flash("error", err.message || "Flyer upload failed.");
      return res.redirect(`/admin/events/${req.params.slug}/edit`);
    }
    next();
  });
}, updateEvent);

// Sermon admin routes removed (sermons deleted)

router.get("/admin/about", isSuperAdmin, isAdmin, adminAboutPage,);

router.post("/admin/about/membership", isSuperAdmin, isAdmin, updateMembership);

router.post("/admin/ministers/create", isSuperAdmin, isAdmin, uploadMinister.single("photo"), createMinister);

router.post("/admin/ministers/:id/toggle", isSuperAdmin, isAdmin, toggleMinisterStatus);

router.post("/admin/ministers/:id/set-in-charge", isSuperAdmin, setMinisterInCharge);

router.get("/admin/ministers/:slug/edit", isSuperAdmin, isAdmin, adminEditMinisterPage);
router.post("/admin/ministers/:slug/edit", isSuperAdmin, isAdmin,uploadMinister.single("photo"), updateMinister);

router.post("/admin/ministers/:slug/delete", isSuperAdmin, deleteMinister);
router.post(
  "/admin/events/:eventId/media",
  isAdmin,
  isSuperAdmin,
  (req, res, next) => {
    uploadEventMedia.array("media", 10)(req, res, function (err) {
      if (err) {
        console.error("uploadEventMedia error:", err);
        req.flash("error", err.message || "Media upload failed.");
        return res.redirect("back");
      }
      next();
    });
  },
  addEventMedia
);

router.post("/admin/events/media/:id/delete", isAdmin, isSuperAdmin, deleteEventMedia);




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


/* ======================= MINISTRIES ======================= */
router.get("/ministries", adminMinistriesPage);
router.get("/ministries/new", newMinistryPage);
router.post("/ministries", createMinistry);
router.get("/ministries/:slug/edit", editMinistryPage);
router.post("/ministries/:slug/edit", updateMinistry);
router.post("/ministries/:slug/delete", deleteMinistry);

/* ======================= CHURCH CONTACTS ======================= */
router.get("/church-contacts", adminChurchContactsPage);
router.get("/church-contacts/new", newChurchContactPage);
router.post("/church-contacts", uploadContactPortrait.single("portrait"), createChurchContact);
router.get("/church-contacts/:id/edit", editChurchContactPage);
router.post("/church-contacts/:id/edit", uploadContactPortrait.single("portrait"), updateChurchContact);
router.post("/church-contacts/:id/delete", deleteChurchContact);

/* ======================= MINISTRY CONTACTS ======================= */
router.get("/ministry-contacts", adminMinistryContactsPage);
router.get("/ministry-contacts/new", newMinistryContactPage);
router.post("/ministry-contacts", uploadContactPortrait.single("portrait"), createMinistryContact);
router.get("/ministry-contacts/:id/edit", editMinistryContactPage);
router.post("/ministry-contacts/:id/edit", uploadContactPortrait.single("portrait"), updateMinistryContact);
router.post("/ministry-contacts/:id/delete", deleteMinistryContact);

export default router;
