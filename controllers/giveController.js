import pool from "../config/db.js";
import slugify from "slugify";

/* =======================
   PUBLIC GIVE PAGE
======================= */
export const givePage = async (req, res) => {
  try {
    const mainResult = await pool.query(
      `
      SELECT *
      FROM give
      WHERE is_main = true
      AND is_active = true
      LIMIT 1
      `
    );

    const projectsResult = await pool.query(
      `
      SELECT *
      FROM give
      WHERE is_main = false
      AND is_active = true
      ORDER BY id DESC
      `
    );

    res.render("give", {
      mainAccount: mainResult.rows[0] || null,
      projects: projectsResult.rows
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading give page");
  }
};

/* =======================
   ADMIN GIVE PAGE
======================= */
export const adminGivePage = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM give
      ORDER BY id DESC
      `
    );

    res.render("admin/give", {
      gives: result.rows
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading admin give page");
  }
};

/* =======================
   CREATE GIVE
======================= */
export const createGive = async (req, res) => {
  try {
    const {
      title,
      description,
      bank_name,
      account_name,
      account_number,
      is_main,
      year
    } = req.body;

    const slug = slugify(title, {
      lower: true,
      strict: true
    });

    if (is_main === "true") {
      await pool.query(`UPDATE give SET is_main = false`);
    }

    await pool.query(
      `
      INSERT INTO give
      (title, slug, description, bank_name, account_name, account_number, is_main, year)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        title,
        slug,
        description,
        bank_name || null,
        account_name || null,
        account_number || null,
        is_main === "true",
        year || new Date().getFullYear()
      ]
    );

    res.redirect("/admin/give");
  } catch (error) {
    console.log(error);
    res.send("Error creating give");
  }
};

/* =======================
   EDIT PAGE
======================= */
export const editGivePage = async (req, res) => {
  try {
    const { slug } = req.params;
    

    const result = await pool.query(
      `
      SELECT *
      FROM give
      WHERE slug = $1
      `,
      [slug]
    );

    res.render("admin/edit-give", {
      give: result.rows[0]
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading edit page");
  }
};

/* =======================
   UPDATE GIVE
======================= */
export const updateGive = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      title,
      description,
      bank_name,
      account_name,
      account_number,
      is_main,
      is_active,
      year
    } = req.body;

    if (is_main === "true") {
      await pool.query(`UPDATE give SET is_main = false`);
    }

    await pool.query(
      `
      UPDATE give
      SET
        title = $1,
        description = $2,
        bank_name = $3,
        account_name = $4,
        account_number = $5,
        is_main = $6,
        is_active = $7,
        year = $8
      WHERE slug = $9
      `,
      [
        title,
        description,
        bank_name || null,
        account_name || null,
        account_number || null,
        is_main === "true",
        is_active === "true",
        year || new Date().getFullYear(),
        slug
      ]
    );

    req.flash('success', 'Giving account updated successfully!');
    res.redirect(`/give/${slug}`);
  } catch (error) {
    console.log(error);
    req.flash('error', 'Error updating giving account.');
    res.redirect(`/admin/give/edit/${req.params.slug}`);
  }
};

/* =======================
   DELETE GIVE
======================= */
export const deleteGive = async (req, res) => {
  try {
    const { slug } = req.params;

    await pool.query(
      `
      DELETE FROM give
      WHERE slug = $1
      `,
      [slug]
    );

    res.redirect("/admin/give");
  } catch (error) {
    console.log(error);
    res.send("Error deleting give");
  }
};
