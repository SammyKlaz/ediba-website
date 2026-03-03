import pool from "../config/db.js";

/* =======================
   SERMONS LIST PAGE
======================= */
export const sermonsPage = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        COUNT(DISTINCT sc.id) AS "comment_count",
        COUNT(DISTINCT sl.id) AS "like_count"
      FROM sermons s
      LEFT JOIN sermon_comments sc
        ON sc.sermon_id = s.id
        AND sc.is_deleted = FALSE
      LEFT JOIN sermon_likes sl
        ON sl.sermon_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);

    res.render("sermons", {
      sermons: result.rows,
      user: req.session.user
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading sermons");
  }
};


/* =======================
   CREATE SERMON COMMENT
======================= */
export const createSermonComment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { comment, parent_comment_id } = req.body;
    const userId = req.session.user.id;

    const sermonResult = await pool.query(
      "SELECT id FROM sermons WHERE slug = $1",
      [slug]
    );

    if (sermonResult.rows.length === 0) {
      return res.status(404).send("Sermon not found");
    }

    const sermonId = sermonResult.rows[0].id;

    await pool.query(
      `
      INSERT INTO sermon_comments
      (sermon_id, user_id, comment, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      `,
      [sermonId, userId, comment, parent_comment_id || null]
    );

    res.redirect(`/sermons/${slug}`);
  } catch (error) {
    console.log(error);
    res.send("Error adding comment");
  }
};


/* =======================
   SINGLE SERMON PAGE
======================= */
export const singleSermonPage = async (req, res) => {
  try {
    const { slug } = req.params;

    const sermonResult = await pool.query(
      "SELECT * FROM sermons WHERE slug = $1",
      [slug]
    );

    if (sermonResult.rows.length === 0) {
      return res.status(404).send("Sermon not found");
    }

    const sermon = sermonResult.rows[0];

    const commentsResult = await pool.query(
      `
      SELECT
        sc.id,
        sc.comment,
        sc.parent_comment_id,
        sc.created_at,
        u.first_name,
        u.last_name
      FROM sermon_comments sc
      JOIN users u ON sc.user_id = u.id
      WHERE sc.sermon_id = $1
        AND sc.is_deleted = FALSE
      ORDER BY sc.created_at ASC
      `,
      [sermon.id]
    );

    // Count ALL comments including replies (matches list page)
    const commentCount = commentsResult.rows.length;

    const likeCountResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM sermon_likes
      WHERE sermon_id = $1
      `,
      [sermon.id]
    );

    res.render("single-sermon", {
      sermon,
      comments: commentsResult.rows,
      commentCount: commentCount,
      likeCount: parseInt(likeCountResult.rows[0].count),
      user: req.session.user
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading sermon");
  }
};


/* =======================
   TOGGLE SERMON LIKE
======================= */
export const toggleSermonLike = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.session.user.id;

    const sermonResult = await pool.query(
      "SELECT id FROM sermons WHERE slug = $1",
      [slug]
    );

    if (sermonResult.rows.length === 0) {
      req.flash('error', 'Sermon not found.');
      return res.redirect("/sermons");
    }

    const sermonId = sermonResult.rows[0].id;

    const likeCheck = await pool.query(
      "SELECT id FROM sermon_likes WHERE sermon_id = $1 AND user_id = $2",
      [sermonId, userId]
    );

    if (likeCheck.rows.length > 0) {
      await pool.query(
        "DELETE FROM sermon_likes WHERE sermon_id = $1 AND user_id = $2",
        [sermonId, userId]
      );
      req.flash('success', 'You unliked this sermon.');
    } else {
      await pool.query(
        "INSERT INTO sermon_likes (sermon_id, user_id) VALUES ($1, $2)",
        [sermonId, userId]
      );
      req.flash('success', 'You liked this sermon!');
    }
    res.redirect(`/sermons/${slug}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error toggling like.');
    res.redirect(`/sermons/${req.params.slug}`);
  }
};
