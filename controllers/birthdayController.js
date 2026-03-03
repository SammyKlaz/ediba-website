import pool from "../config/db.js";

/* =======================
   BIRTHDAYS LIST PAGE
======================= */
export const birthdaysPage = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const result = await pool.query(
      `
      SELECT *
      FROM birthdays
      WHERE year = $1
      ORDER BY EXTRACT(MONTH FROM birth_date), EXTRACT(DAY FROM birth_date)
      `,
      [currentYear]
    );

    res.render("admin/birthdays", {
      birthdays: result.rows,
      user: req.session.user
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading birthdays");
  }
};

/* =======================
   CREATE BIRTHDAY PAGE
======================= */
export const createBirthdayPage = async (req, res) => {
  res.render("admin/create-birthday", { user: req.session.user });
};

/* =======================
   CREATE BIRTHDAY
======================= */
export const createBirthday = async (req, res) => {
  try {
    const { name, birth_date, arm, position, year } = req.body;
    const photo = req.file ? req.file.filename : null;

    if (!name || !birth_date || !arm || !photo || !year) {
      return res.send("Missing required fields");
    }

    await pool.query(
      `
      INSERT INTO birthdays (name, birth_date, photo, arm, position, year)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [name, birth_date, photo, arm, position || null, year]
    );

    res.redirect("/admin/birthdays");
  } catch (error) {
    console.log(error);
    res.send("Error creating birthday");
  }
};

/* =======================
   EDIT BIRTHDAY PAGE
======================= */
export const editBirthdayPage = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM birthdays WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.send("Birthday not found");
    }

    res.render("admin/edit-birthday", {
      birthday: result.rows[0],
      user: req.session.user
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading birthday");
  }
};

/* =======================
   UPDATE BIRTHDAY
======================= */
export const updateBirthday = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, birth_date, arm, position, is_active, year } = req.body;
    const photo = req.file ? req.file.filename : null;

    if (photo) {
      await pool.query(
        `
        UPDATE birthdays
        SET
          name = $1,
          birth_date = $2,
          arm = $3,
          position = $4,
          photo = $5,
          is_active = $6,
          year = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        `,
        [name, birth_date, arm, position || null, photo, is_active, year, id]
      );
    } else {
      await pool.query(
        `
        UPDATE birthdays
        SET
          name = $1,
          birth_date = $2,
          arm = $3,
          position = $4,
          is_active = $5,
          year = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        `,
        [name, birth_date, arm, position || null, is_active, year, id]
      );
    }

    res.redirect("/admin/birthdays");
  } catch (error) {
    console.log(error);
    res.send("Error updating birthday");
  }
};

/* =======================
   DELETE BIRTHDAY
======================= */
export const deleteBirthday = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM birthdays WHERE id = $1", [id]);

    res.redirect("/admin/birthdays");
  } catch (error) {
    console.log(error);
    res.send("Error deleting birthday");
  }
};
