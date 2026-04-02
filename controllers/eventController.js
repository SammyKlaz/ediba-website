import pool from "../config/db.js";
import { getPublicIdFromFile, destroyPublicId } from '../utils/cloudinaryHelpers.js';


/* =======================
   EVENTS LIST PAGE
======================= */
export const eventsPage = async (req, res) => {
  try {
    const eventsResult = await pool.query(`
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
      ORDER BY e.event_date ASC
    `);

    const birthdaysResult = await pool.query(`
      SELECT *,
        EXTRACT(DAY FROM birth_date) AS birth_day
      FROM birthdays
      WHERE
        EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND year =
          CASE
            WHEN EXTRACT(MONTH FROM CURRENT_DATE) = 12
                 AND EXTRACT(MONTH FROM birth_date) = 1
            THEN EXTRACT(YEAR FROM CURRENT_DATE) + 1
            ELSE EXTRACT(YEAR FROM CURRENT_DATE)
          END
        AND is_active = TRUE
      ORDER BY EXTRACT(DAY FROM birth_date)
    `);

    const today = new Date().getDate();

    const birthdays = birthdaysResult.rows.map(b => ({
      ...b,
      is_today: Number(b.birth_day) === today,
      is_upcoming: Number(b.birth_day) > today,
      is_past: Number(b.birth_day) < today
    }));

    res.render("events", {
      events: eventsResult.rows,
      birthdays,
      user: req.session.user
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading events");
  }
};



/* =======================
   SLUG GENERATOR
======================= */
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* =======================
   CREATE EVENT
======================= */
export const createEvent = async (req, res) => {
  try {
    const { title, description, event_date } = req.body;
    const flyer = req.file ? req.file.path : null;
    const flyer_public_id = req.file ? getPublicIdFromFile(req.file) : null;

    const slug = generateSlug(title);

    await pool.query(
      `
      INSERT INTO events (title, slug, description, event_date, flyer, flyer_public_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [title, slug, description, event_date, flyer, flyer_public_id]
    );

    res.redirect("/events");
  }  catch (error) {
    // Structured logging to help diagnose Cloudinary timeouts and upload problems
    const fileInfo = req.file
      ? {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path,
          filename: req.file.filename || req.file.public_id || null
        }
      : null;

    const errInfo = {
      message: error && error.message,
      name: error && error.name,
      http_code: error && error.http_code,
      storageErrors: Array.isArray(error && error.storageErrors) ? error.storageErrors : undefined,
      stack: error && error.stack
    };

    console.error("createEvent error", {
      timestamp: new Date().toISOString(),
      error: errInfo,
      file: fileInfo,
      body: req.body
    });

    res.status(500).send("Error creating event");

  };
};

/* =======================
   CREATE COMMENT
======================= */
export const createComment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { comment, parent_comment_id } = req.body;
    const userId = req.session.user.id;

    const eventResult = await pool.query(
      "SELECT id, slug, comment_enabled FROM events WHERE slug = $1",
      [slug]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).send("Event not found");
    }

    if (!eventResult.rows[0].comment_enabled) {
      return res.status(403).send("Comments are disabled for this event");
    }

    const eventId = eventResult.rows[0].id;

    await pool.query(
      `
      INSERT INTO event_comments (event_id, user_id, comment, parent_comment_id)
      VALUES ($1, $2, $3, $4) 
      `,
      [eventId, userId, comment, parent_comment_id || null]
    );

    res.redirect(`/events/${slug}`);
  } catch (error) {
    console.log(error);
    res.send("Error adding comment");
  }
};


/* =======================
   SINGLE EVENT PAGE
======================= */
export const singleEventPage = async (req, res) => {
  try {
    const { slug } = req.params;

    // Get event
    const eventResult = await pool.query(
      "SELECT * FROM events WHERE slug = $1",
      [slug]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).send("Event not found");
    }

    const event = eventResult.rows[0];

    // Get comments
    const commentsResult = await pool.query(
      `
      SELECT 
        ec.id,
        ec.comment,
        ec.parent_comment_id,
        ec.created_at,
          ec.user_id,
          u.first_name,
          u.last_name
      FROM event_comments ec
      JOIN users u ON ec.user_id = u.id
      WHERE ec.event_id = $1
        AND ec.is_deleted = FALSE
      ORDER BY ec.created_at ASC
      `,
      [event.id]
    );

    const commentCount = commentsResult.rows.length;

    // Get likes
    const likesResult = await pool.query(
      `SELECT COUNT(*) as count FROM event_likes WHERE event_id = $1`,
      [event.id]
    );

    const likeCount = parseInt(likesResult.rows[0].count);

    // ===== NEW: get event media =====
    const mediaResult = await pool.query(
      `SELECT * FROM event_media WHERE event_id = $1 ORDER BY created_at ASC`,
      [event.id]
    );
    const media = mediaResult.rows;

    // Render template
    res.render("single-event", {
      event,
      comments: commentsResult.rows,
      commentCount,
      likeCount,
      user: req.session.user,
      media // <-- pass media here
    });

  } catch (error) {
    console.log(error);
    res.send("Error loading event");
  }
};

/* =======================
   UPDATE COMMENT
======================= */
export const updateComment = async (req, res) => {
  try {
    const { slug, id } = req.params;
    const { comment } = req.body;
    const userId = req.session.user.id;

    // verify comment exists and ownership
    const cRes = await pool.query('SELECT user_id FROM event_comments WHERE id = $1 AND is_deleted = FALSE', [id]);
    if (cRes.rows.length === 0) {
      req.flash('error', 'Comment not found.');
      return res.redirect(`/events/${slug}`);
    }

    const ownerId = cRes.rows[0].user_id;
    const isAdmin = req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'super_admin');
    if (ownerId !== userId && !isAdmin) {
      req.flash('error', 'You can only edit your own comments.');
      return res.redirect(`/events/${slug}`);
    }

    await pool.query('UPDATE event_comments SET comment = $1 WHERE id = $2', [comment, id]);
    req.flash('success', 'Comment updated.');
    res.redirect(`/events/${slug}`);
  } catch (error) {
    console.log(error);
    req.flash('error', 'Error updating comment.');
    res.redirect(`/events/${req.params.slug}`);
  }
};

/* =======================
   DELETE COMMENT
======================= */
export const deleteComment = async (req, res) => {
  try {
    const { slug, id } = req.params;
    const userId = req.session.user.id;

    const cRes = await pool.query('SELECT user_id FROM event_comments WHERE id = $1 AND is_deleted = FALSE', [id]);
    if (cRes.rows.length === 0) {
      req.flash('error', 'Comment not found.');
      return res.redirect(`/events/${slug}`);
    }

    const ownerId = cRes.rows[0].user_id;
    const isAdmin = req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'super_admin');
    if (ownerId !== userId && !isAdmin) {
      req.flash('error', 'You can only delete your own comments.');
      return res.redirect(`/events/${slug}`);
    }

    // soft delete
    await pool.query('UPDATE event_comments SET is_deleted = TRUE WHERE id = $1', [id]);
    req.flash('success', 'Comment deleted.');
    res.redirect(`/events/${slug}`);
  } catch (error) {
    console.log(error);
    req.flash('error', 'Error deleting comment.');
    res.redirect(`/events/${req.params.slug}`);
  }
};


/* =======================
   TOGGLE EVENT LIKE
======================= */

export const toggleEventLike = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.session.user.id;

    const eventResult = await pool.query(
      "SELECT id FROM events WHERE slug = $1",
      [slug]
    );

    if (eventResult.rows.length === 0) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    const eventId = eventResult.rows[0].id;

    const likeCheck = await pool.query(
      "SELECT id FROM event_likes WHERE event_id = $1 AND user_id = $2",
      [eventId, userId]
    );

    if (likeCheck.rows.length > 0) {
      await pool.query(
        "DELETE FROM event_likes WHERE event_id = $1 AND user_id = $2",
        [eventId, userId]
      );
      req.flash('success', 'You unliked this event.');
    } else {
      await pool.query(
        "INSERT INTO event_likes (event_id, user_id) VALUES ($1, $2)",
        [eventId, userId]
      );
      req.flash('success', 'You liked this event!');
    }
    res.redirect(`/events/${slug}`);
  } catch (error) {
    console.log(error);
    req.flash('error', 'Error toggling like.');
    res.redirect(`/events/${req.params.slug}`);
  }
};

/* =======================
   EDIT EVENT
======================= */
export const editEvent = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, description, event_date } = req.body;
    const flyer = req.file ? req.file.path : null;
    const flyer_public_id = req.file ? getPublicIdFromFile(req.file) : null;

    if (flyer) {
      await pool.query(
        `UPDATE events 
         SET title = $1, description = $2, event_date = $3, flyer = $4, flyer_public_id = $5
         WHERE slug = $6`,
        [title, description, event_date, flyer, flyer_public_id, slug]
      );
    } else {
      await pool.query(
        `UPDATE events 
         SET title = $1, description = $2, event_date = $3
         WHERE slug = $4`,
        [title, description, event_date, slug]
      );
    }

    req.flash('success', 'Event updated successfully!');
    res.redirect(`/events/${slug}`);
  } catch (error) {
    const fileInfo = req.file
      ? {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path,
          filename: req.file.filename || req.file.public_id || null
        }
      : null;

    const errInfo = {
      message: error && error.message,
      name: error && error.name,
      http_code: error && error.http_code,
      storageErrors: Array.isArray(error && error.storageErrors) ? error.storageErrors : undefined,
      stack: error && error.stack
    };

    console.error('editEvent error', {
      timestamp: new Date().toISOString(),
      error: errInfo,
      file: fileInfo,
      body: req.body
    });

    req.flash('error', 'Error updating event.');
    res.redirect(`/admin/events/${req.params.slug}/edit`);
  }
};

/* =======================
   DELETE EVENT
======================= */
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

    await pool.query("DELETE FROM events WHERE slug = $1", [slug]);

    res.redirect("/events");
  } catch (error) {
    console.log(error);
    res.send("Error deleting event");
  }
};

/* =======================
   TOGGLE EVENT COMMENTS
======================= */
export const toggleEventComments = async (req, res) => {
  try {
    const { slug } = req.params;

    const eventResult = await pool.query(
      "SELECT comment_enabled FROM events WHERE slug = $1",
      [slug]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).send("Event not found");
    }

    const newCommentStatus = !eventResult.rows[0].comment_enabled;

    await pool.query(
      "UPDATE events SET comment_enabled = $1 WHERE slug = $2",
      [newCommentStatus, slug]
    );

    res.redirect("/admin/events");
  } catch (error) {
    console.log(error);
    res.send("Error toggling comments");
  }
};
