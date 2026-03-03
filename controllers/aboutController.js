import pool from "../config/db.js";

export const aboutPage = async (req, res) => {
  try {
    const membershipResult = await pool.query(
      `
      SELECT membership_total, membership_year
      FROM about
      ORDER BY id DESC
      LIMIT 1
      `
    );

    const membership = membershipResult.rows[0] || null;

    const ministerInChargeResult = await pool.query(
      `
      SELECT name, slug, photo, short_intro
      FROM ministers
      WHERE is_in_charge = true
        AND is_active = true
      LIMIT 1
      `
    );

    const ministerInCharge = ministerInChargeResult.rows[0] || null;

    const otherMinistersResult = await pool.query(
      `
      SELECT name, photo, position
      FROM ministers
      WHERE is_in_charge = false
        AND is_active = true
      ORDER BY created_at ASC
      `
    );

    res.render("about", {
      membership,
      ministerInCharge,
      otherMinisters: otherMinistersResult.rows
    });

  } catch (error) {
    console.log(error);
    res.send("Error loading about page");
  }
}


export const ministerProfile = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `
      SELECT
        name,
        photo,
        biography,
        position
      FROM ministers
      WHERE slug = $1
        AND is_active = true
      LIMIT 1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Minister not found");
    }

    res.render("minister-bio", {
      minister: result.rows[0],
      user: req.session.user
    });

  } catch (error) {
    console.log(error);
    res.send("Error loading biography");
  }
};
