import express from "express";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import transporter from "../config/email.js";
import crypto from "crypto";

const router = express.Router();

/* ================= REGISTER ================= */

router.get("/register", (req, res) => {
  res.render("auth/register", {
    error: req.query.error,
    success: req.query.success
  });
});


router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password, confirmPassword } = req.body;

    // 1. Password length (simple rule)
    if (password.length < 8) {
      return res.redirect(
        "/register?error=Password must be at least 8 characters"
      );
    }

    // 2. Passwords must match
    if (password !== confirmPassword) {
      return res.redirect(
        "/register?error=Passwords do not match"
      );
    }

    // 3. Check email
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.redirect(
        "/register?error=Email already exists"
      );
    }

    // 4. Hash and save
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)",
      [first_name, last_name, email, hashedPassword]
    );

    res.redirect(
      "/login?success=Your account has been created successfully. Please log in."
    );
  } catch (error) {
    console.error(error);
    res.redirect(
      "/register?error=Something went wrong"
    );
  }
});

/* ================= LOGIN ================= */

router.get("/login", (req, res) => {
    res.render("auth/login", {
    error: req.query.error,
    success: req.query.success
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

   if (userResult.rows.length === 0) {
  return res.redirect("/login?error=Email not found");
}


    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
    return res.redirect("/login?error=The email or password is incorrect. Please try again.");
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    };

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.redirect("/login");
  }
});

/* ================= LOGOUT ================= */

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

/* ================= FORGOT PASSWORD ================= */

router.get("/forgot-password", (req, res) => {
  res.render("auth/forgot-password", {
    error: req.query.error,
    success: req.query.success
  });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const userResult = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (userResult.rows.length === 0) {
    return res.redirect(
      "/forgot-password?error=Email does not exist"
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await pool.query(
    "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3",
    [token, expires, email]
  );

  const resetLink = `${process.env.APP_URL}/reset-password/${token}`;

  await transporter.verify();
  console.log("Mail transporter is ready");

  await transporter.sendMail({
    from: `PCN Ediba Qua Parish <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset",
    text: `Click this link to reset your password: ${resetLink}`,
  });

  res.redirect(
    "/forgot-password?success=Check your email to reset your password"
  );
});

/* ================= RESET PASSWORD ================= */

router.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;

  const result = await pool.query(
    "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
    [token]
  );

  if (result.rows.length === 0) {
    return res.redirect("/forgot-password");
  }

  res.render("auth/reset-password", { 
    token,
    error: req.query.error
  });
});

router.post("/reset-password", async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.redirect(
      `/reset-password/${token}?error=Passwords do not match`
    );
  }

  if (password.length < 8) {
    return res.redirect(
      `/reset-password/${token}?error=Password must be at least 8 characters`
    );
  }

  const result = await pool.query(
    "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
    [token]
  );

  if (result.rows.length === 0) {
    return res.redirect("/forgot-password");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await pool.query(
    "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2",
    [hashedPassword, token]
  );

  res.redirect("/login?success=Your password has been reset successful. You can now login.");
});

export default router;