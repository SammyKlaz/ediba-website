import pool from "../config/db.js";

/* =======================
   SUPER ADMIN USERS PAGE
======================= */
export const adminUsersPage = async (req, res) => {
  try {
    const q = req.query.q?.trim() || "";

    let usersQuery = `
      SELECT id, first_name, last_name, email, role, is_active
      FROM users
    `;

    let values = [];

    if (q) {
      usersQuery += `
        WHERE
          first_name ILIKE $1
          OR last_name ILIKE $1
          OR email ILIKE $1
          OR CONCAT(first_name, ' ', last_name) ILIKE $1
      `;
      values.push(`%${q}%`);
    }

    usersQuery += ` ORDER BY created_at ASC`;

    const { rows } = await pool.query(usersQuery, values);

    res.render("admin/users", {
      users: rows,
      query: q,
      notFound: q && rows.length === 0
    });

  } catch (error) {
    console.error(error);
    res.send("Error loading users page");
  }
};

/* =======================
   UPDATE USER ROLE
======================= */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent changing superadmin role
    const userResult = await pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    if (userResult.rows[0].role === 'super_admin') {
      req.flash('error', 'Cannot change superadmin role.');
      return res.redirect('/admin/users');
    }

    await pool.query(
      `
      UPDATE users
      SET role = $1
      WHERE id = $2
      `,
      [role, id]
    );

    req.flash('success', 'User role updated successfully!');
    res.redirect("/admin/users");

  } catch (error) {
    console.log(error);
    req.flash('error', 'Error updating role.');
    res.redirect('/admin/users');
  }
};

/* =======================
   TOGGLE USER STATUS
======================= */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is superadmin - prevent deactivation
    const userResult = await pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found");
    }

    if (userResult.rows[0].role === 'super_admin') {
      return res.status(403).send("Cannot deactivate superadmin account");
    }

    await pool.query(
      `
      UPDATE users
      SET is_active = NOT is_active
      WHERE id = $1
      `,
      [id]
    );

    res.redirect("/admin/users");

  } catch (error) {
    console.log(error);
    res.send("Error updating status");
  }
};
