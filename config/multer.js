import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/* =======================
   HOME PAGE IMAGE UPLOAD
======================= */

const homeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "church/home",
    allowed_formats: ["jpg", "png", "jpeg", "webp"]
  }
});

export const uploadHomeImages = multer({ storage: homeStorage });


/* =======================
   EVENT IMAGE UPLOAD
======================= */
/* =======================
   EVENT IMAGE UPLOAD
======================= */

const eventStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "church/events",
      resource_type: "image",
      allowed_formats: ["jpg", "png", "jpeg", "webp"]
    };
  }
});

export const uploadEvent = multer({
  storage: eventStorage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype && file.mimetype.startsWith("image/");
    if (!ok) {
      return cb(new Error("Only image files are allowed for event flyers"));
    }
    cb(null, true);
  }
});

/* =======================
   SERMON VIDEO UPLOAD
======================= */

// Sermon video upload removed — sermons replaced by Contact/Get Involved pages.
// If you later want to re-enable sermon video uploads, recreate a CloudinaryStorage
// with resource_type: 'video' and export uploadSermonVideo.


/* =======================
   MINISTER IMAGE UPLOAD
======================= */

const ministerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "church/ministers",
    allowed_formats: ["jpg", "png", "jpeg", "webp"]
  }
});

export const uploadMinister = multer({ storage: ministerStorage });


/* =======================
   BIRTHDAY IMAGE UPLOAD
======================= */

const birthdayStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "church/birthdays",
    allowed_formats: ["jpg", "png", "jpeg", "webp"]
  }
});

export const uploadBirthday = multer({ storage: birthdayStorage });


/* =======================
   EVENT MEDIA UPLOAD
======================= */

const eventMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype && file.mimetype.startsWith("video/");
    return {
      folder: "church/event-media",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo
        ? ["mp4", "mov", "webm", "mkv"]
        : ["jpg", "png", "jpeg", "webp"]
    };
  }
});

export const uploadEventMedia = multer({
  storage: eventMediaStorage,
  limits: {
    fileSize: 20 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/");

    if (!ok) {
      return cb(new Error("Only image and video files are allowed"));
    }

    cb(null, true);
  }
});


/* =======================
   RECEIPT IMAGE UPLOAD
======================= */

const receiptStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "church/receipts",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

/*CHURCH CONTACTS AND MINISTRIES*/
const contactPortraitStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => {
    return {
      folder: "church/contacts",
      resource_type: "image",
      allowed_formats: ["jpg", "png", "jpeg", "webp"]
    };
  }
});

export const uploadContactPortrait = multer({
  storage: contactPortraitStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype && file.mimetype.startsWith("image/");
    if (!ok) {
      return cb(new Error("Only image files are allowed for contact portraits"));
    }
    cb(null, true);
  }
});

export const receiptUpload = multer({ storage: receiptStorage });