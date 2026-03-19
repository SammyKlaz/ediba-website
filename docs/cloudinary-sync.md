This document explains how Cloudinary public_id sync works in this project.

Overview
- We store Cloudinary public_id in DB columns (see `migrations/add_media_public_ids.sql` and `render_schema.sql`).
- Upload flows use `multer-storage-cloudinary` which sets `req.file.path` (secure URL) and `req.file.filename` (public_id) in many configs.
- Deletion flows now call Cloudinary's `uploader.destroy(public_id, { resource_type })` before deleting DB rows.

Key helper: `utils/cloudinaryHelpers.js`
- getPublicIdFromFile(file): returns `file.filename` or `file.public_id` if present, otherwise attempts to parse public_id from `file.path` URL.
- parsePublicIdFromUrl(url): extracts the public_id portion from a Cloudinary URL by locating `/upload/`, removing any version `v123/` segment and stripping file extension.
- destroyPublicId(publicId, resourceType): calls Cloudinary to destroy the resource. Caller should handle errors.

Files changed
- `controllers/adminController.js`
  - `addEventMedia`: now saves `public_id` into `event_media.public_id` when inserting.
  - `deleteEventMedia`: attempts to destroy Cloudinary resource (uses `media.public_id` or parses from `file_name`) then deletes DB record.
  - `createSermon` / `updateSermon` / `deleteSermon`: save and destroy `video_public_id`.
  - `createMinister` / `updateMinister` / `deleteMinister`: save and destroy `photo_public_id`.
- `controllers/adminReceiptController.js`
  - `storeReceipt`, `updateReceipt`, `deleteReceipt`: save `image_public_id` and destroy on delete.
- `controllers/homepageImageController.js`
  - `adminUpdateHomepageImage`, `adminDeleteHomepageImage`: save and destroy `public_id`.
- `controllers/birthdayController.js`
  - `createBirthday`, `updateBirthday`, `deleteBirthday`: save and destroy `photo_public_id`.
- `controllers/eventController.js`
  - `createEvent`, `editEvent`, `deleteEvent`: save and destroy `flyer_public_id`.
- `scripts/backfill_public_ids.js` - New script to populate public_id by parsing existing Cloudinary URLs.

Backfill script
- Dry-run (safe):
```bash
node scripts/backfill_public_ids.js --dry-run
```
- Commit (writes to DB):
```bash
node scripts/backfill_public_ids.js --commit
```

Notes & caveats
- Parsing public_id from URL is heuristical. If your Cloudinary URLs include transformations or other unusual patterns, the script might miss some. For those, consider using Cloudinary Admin API to search by filename.
- Deleting resources is best-effort: if Cloudinary reports resource not found, the code logs a warning and still removes the DB record.
- Resource types: `image` vs `video` are inferred from MIME types or table fields. If you upload `raw` resources, adjust accordingly.

If you want, I can now run the backfill dry-run and then the commit, or start the server and run an end-to-end upload/delete test. Provide permission to run these actions.
