import pool from "../config/db.js";
import slugify from "slugify";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { getPublicIdFromFile, destroyPublicId } from "../utils/cloudinaryHelpers.js";

export const adminDashboard = (req, res) => {
  res.render("admin/dashboard");
};

export const adminEvents = async (req, res) => {
  try {
    // Fetch all events from the database
   const result = await pool.query(
 `
      SELECT 
        e.*,
        COUNT(DISTINCT ec.id) AS comment_count,
        COUNT(DISTINCT el.id) AS like_count
      FROM events e
      LEFT JOIN event_comments ec
        ON ec.event_id = e.id
        AND ec.is_deleted = FALSE
      LEFT JOIN event_likes el
        ON el.event_id = e.id
      GROUP BY e.id
      ORDER BY e.event_date DESC
      `
);

    // Render the admin events page
    res.render("admin/events", {
      events: result.rows, // this is the list of all events
      user: req.session.user, // includes role, needed for admin-only logic
      role: req.session.user.role
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading admin events");
  }
};

export const toggleComments = async (req, res) => {
  try {
    const { slug } = req.params;

    // Get current comment status
    const eventResult = await pool.query(
      "SELECT comment_enabled FROM events WHERE slug = $1",
      [slug]
    );
    
    if (eventResult.rows.length === 0) {
      return res.status(404).send("Event not found");
    }

    const currentStatus = eventResult.rows[0].comment_enabled;

    // Flip the value
    await pool.query(
      "UPDATE events SET comment_enabled = $1 WHERE slug = $2",
      [!currentStatus, slug]
    );

    res.redirect("/admin/events"); // reload the admin page
  } catch (error) {
    console.log(error);
    res.send("Error toggling comments");
  }
};

export const editEventPage = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1️⃣ Fetch the event
    const result = await pool.query(
      "SELECT * FROM events WHERE slug = $1",
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Event not found");
    }

    const event = result.rows[0];

    // 2️⃣ Fetch the media for this event
    const mediaResult = await pool.query(
      "SELECT * FROM event_media WHERE event_id = $1 ORDER BY created_at DESC",
      [event.id]
    );
    const eventMedia = mediaResult.rows;

    // 3️⃣ Render the page with event and media
    res.render("admin/edit-event", {
      event,
      eventMedia,        // ✅ pass the media array
      user: req.session.user
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading edit page");
  }
};


export const updateEvent = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, description, event_date } = req.body;
    const flyer = req.file ? req.file.path : null;
    const flyer_public_id = req.file ? getPublicIdFromFile(req.file) : null;

    if (flyer) {
      await pool.query(
        `
        UPDATE events
        SET title = $1,
            description = $2,
            event_date = $3,
            flyer = $4,
            flyer_public_id = $5
        WHERE slug = $6
        `,
        [title, description, event_date, flyer, flyer_public_id, slug]
      );
    } else {
      await pool.query(
        `
        UPDATE events
        SET title = $1,
            description = $2,
            event_date = $3
        WHERE slug = $4
        `,
        [title, description, event_date, slug]
      );
    }

    res.redirect("/admin/events");
  } catch (error) {
    console.error("admin updateEvent error:", error);
    console.error("req.file:", req.file);
    console.error("req.body:", req.body);
    res.status(500).send("Error updating event");
  }
};


export const deleteEvent = async (req, res) => {
  try {
    const { slug } = req.params;
    // fetch event record so we can delete Cloudinary flyer if present
    const r = await pool.query('SELECT * FROM events WHERE slug = $1', [slug]);
    if (r.rows.length > 0) {
      const ev = r.rows[0];
      try {
        if (ev.flyer_public_id) await destroyPublicId(ev.flyer_public_id, 'image');
        else if (ev.flyer) {
          const parsed = getPublicIdFromFile({ path: ev.flyer });
          if (parsed) await destroyPublicId(parsed, 'image');
        }
      } catch (err) {
        console.warn('Error deleting event flyer from Cloudinary', err);
      }
    }

    await pool.query(
      "DELETE FROM events WHERE slug = $1",
      [slug]
    );

    res.redirect("/admin/events");
  } catch (error) {
    console.log(error);
    res.send("Error deleting event");
  }
};



// Sermon management removed. Sermon-related routes, views and DB schema have been deleted.



/* =======================
   ADMIN ABOUT PAGE
======================= */
export const adminAboutPage = async (req, res) => {
  try {
    const membershipResult = await pool.query(
      "SELECT * FROM about ORDER BY id DESC LIMIT 1"
    );

    const ministersResult = await pool.query(
      `
      SELECT *
      FROM ministers
      ORDER BY created_at ASC
      `
    );

    res.render("admin/about", {
      membership: membershipResult.rows[0] || null,
      ministers: ministersResult.rows
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading admin about page");
  }
};

/* =======================
   UPDATE MEMBERSHIP
======================= */
export const updateMembership = async (req, res) => {
  try {
    const { membership_total, membership_year } = req.body;

    await pool.query(
      `
      INSERT INTO about (membership_total, membership_year)
      VALUES ($1, $2)
      `,
      [membership_total, membership_year]
    );

    res.redirect("/admin/about");
  } catch (error) {
    console.log(error);
    res.send("Error updating membership");
  }
};

/* =======================
   CREATE MINISTER
======================= */
export const createMinister = async (req, res) => {
  try {
    const { name, position, short_intro, biography } = req.body;
    const photo = req.file ? req.file.path : null;
    const photo_public_id = req.file ? getPublicIdFromFile(req.file) : null;

    const slug = slugify(name, {
      lower: true,
      strict: true
    });

    const isInCharge = position === "Minister In Charge";

    if (isInCharge) {
      await pool.query(
        "UPDATE ministers SET is_in_charge = false"
      );
    }

    await pool.query(
      `
      INSERT INTO ministers
      (name, slug, photo, photo_public_id, position, short_intro, biography, is_in_charge, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
      `,
      [
        name,
        slug,
        photo,
        photo_public_id,
        position,
        isInCharge ? short_intro : null,
        isInCharge ? biography : null,
        isInCharge
      ]
    );

    res.redirect("/admin/about");
  } catch (error) {
    console.log(error);
    res.send("Error creating minister");
  }
};

/* =======================
   ACTIVATE OR DEACTIVATE
======================= */
export const toggleMinisterStatus = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE ministers
      SET is_active = NOT is_active
      WHERE id = $1
      `,
      [id]
    );

    res.redirect("/admin/about");
  } catch (error) {
    console.log(error);
    res.send("Error updating minister status");
  }
};

/* =======================
   SET MINISTER IN CHARGE
======================= */
export const setMinisterInCharge = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE ministers SET is_in_charge = false"
    );

    await pool.query(
      `
      UPDATE ministers
      SET is_in_charge = true,
          position = 'Minister In Charge'
      WHERE id = $1
      `,
      [id]
    );

    res.redirect("/admin/about");
  } catch (error) {
    console.log(error);
    res.send("Error setting minister in charge");
  }
};


export const adminEditMinisterPage = async (req, res) => {
  const { slug } = req.params;

  const result = await pool.query(
    "SELECT * FROM ministers WHERE slug = $1",
    [slug]
  );

  if (result.rows.length === 0) {
    return res.redirect("/admin/about");
  }

  res.render("admin/edit-minister", {
    minister: result.rows[0]
  });
};


export const updateMinister = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, position, short_intro, biography } = req.body;

    let photoQuery = "";
    let values = [name, position, short_intro, biography];

    if (req.file) {
      const photo_public_id = getPublicIdFromFile(req.file);
      photoQuery = ", photo = $5, photo_public_id = $6";
      values.push(req.file.path);
      values.push(photo_public_id);
      values.push(slug);
    } else {
      values.push(slug);
    }

    await pool.query(
      `
      UPDATE ministers
      SET
        name = $1,
        position = $2,
        short_intro = $3,
        biography = $4
        ${photoQuery}
      WHERE slug = $${values.length}
      `,
      values
    );

    res.redirect("/admin/about");

  } catch (error) {
    console.log(error);
    res.send("Error updating minister");
  }
};



export const deleteMinister = async (req, res) => {
  const { slug } = req.params;

  // fetch minister to obtain public id
  try {
    const r = await pool.query('SELECT * FROM ministers WHERE slug = $1', [slug]);
    if (r.rows.length > 0) {
      const m = r.rows[0];
      try {
        if (m.photo_public_id) await destroyPublicId(m.photo_public_id, 'image');
        else if (m.photo) {
          const parsed = getPublicIdFromFile({ path: m.photo });
          if (parsed) await destroyPublicId(parsed, 'image');
        }
      } catch (err) {
        console.warn('Error deleting minister photo from Cloudinary', err);
      }
    }

    await pool.query(
      "DELETE FROM ministers WHERE slug = $1",
      [slug]
    );

    res.redirect("/admin/about");
  } catch (err) {
    console.error(err);
    res.redirect('/admin/about');
  }
};

/// EVENTS MEDIA ///

export const addEventMedia = async (req, res) => {
  const { eventId } = req.params;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      message: "No media uploaded. Please select at least one file."
    });
  }

  try {
    const eventResult = await pool.query(
      "SELECT id, slug FROM events WHERE id = $1",
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).send("Event not found");
    }

    const event = eventResult.rows[0];

    const values = req.files.map(file => {
      const mediaType =
        file.mimetype && file.mimetype.startsWith("image")
          ? "image"
          : "video";

      return {
        event_id: eventId,
        file_name: file.path,
        media_type: mediaType,
        public_id: getPublicIdFromFile(file)
      };
    });

    for (const media of values) {
      await pool.query(
        `
        INSERT INTO event_media (event_id, file_name, media_type, public_id)
        VALUES ($1, $2, $3, $4)
        `,
        [media.event_id, media.file_name, media.media_type, media.public_id]
      );
    }

    res.send(`
      <script>
        alert("Event media uploaded successfully");
        window.location.href = "/admin/events/${event.slug}/edit";
      </script>
    `);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to upload media"
    });
  }
};



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const deleteEventMedia = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT event_media.*, events.slug
      FROM event_media
      JOIN events ON event_media.event_id = events.id
      WHERE event_media.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.redirect("back");
    }

    const media = result.rows[0];

    // attempt to delete the Cloudinary asset if possible
    try {
      const resourceType = media.media_type === 'video' ? 'video' : 'image';
      if (media.public_id) {
        await destroyPublicId(media.public_id, resourceType);
      } else if (media.file_name) {
        const parsed = getPublicIdFromFile({ path: media.file_name });
        if (parsed) await destroyPublicId(parsed, resourceType);
      }
    } catch (err) {
      console.warn('Error deleting event media from Cloudinary', err);
    }

    await pool.query(
      "DELETE FROM event_media WHERE id = $1",
      [id]
    );

    res.redirect(`/admin/events/${media.slug}/edit`);
  } catch (error) {
    console.error("deleteEventMedia error:", error);
    res.redirect("back");
  }
};