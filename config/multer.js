import e from "express";
import multer from "multer";
import path from "path";


/* =======================
   HOME PAGE IMAGE UPLOAD
======================= */

const homeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/home");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const homeFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

export const uploadHomeImages = multer({
  storage: homeStorage,
  fileFilter: homeFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* =======================
   EVENT IMAGE UPLOAD
======================= */

const eventStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/events");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

export const uploadEvent = multer({ storage: eventStorage });


/* =======================
   SERMON VIDEO UPLOAD
======================= */
const sermonStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/sermons");
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  }
});

export const uploadSermonVideo = multer({
  storage: sermonStorage
});


/* =======================
   MINISTER IMAGE UPLOAD
======================= */

const ministerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/ministers");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

export const uploadMinister = multer({
  storage: ministerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});


/* =======================
   BIRTHDAY IMAGE UPLOAD
======================= */
const birthdayStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/birthdays");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const birthdayFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

export const uploadBirthday = multer({
  storage: birthdayStorage,
  fileFilter: birthdayFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});



/* =======================
   EVENT POST MEDIA UPLOAD
======================= */

const eventMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/events/media");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const eventMediaFileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image and video files allowed"),
      false
    );
  }
};

export const uploadEventMedia = multer({
  storage: eventMediaStorage,
  fileFilter: eventMediaFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
});

//========Receipts========


export const receiptUpload = multer({
  storage: multer.diskStorage({
    destination: "public/uploads/receipts",
    filename: (req, file, cb) => {
      const uniqueName =
        "IMG-" + Date.now() + path.extname(file.originalname);
      cb(null, uniqueName);
    }
  })
});
