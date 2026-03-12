import pool from "../config/db.js";

/* SHOW ALL RECEIPTS */
export const adminReceiptsPage = async (req, res) => {
  const receipts = await pool.query(
    "SELECT * FROM receipts ORDER BY created_at DESC"
  );

  res.render("admin/receipts/index", {
    receipts: receipts.rows || []
  });
};

/* SHOW CREATE FORM */
export const createReceiptPage = (req, res) => {
  res.render("admin/receipts/create");
};

/* STORE RECEIPT */
export const storeReceipt = async (req, res) => {
  const { title, description, amount } = req.body;
  const image = req.file ? req.file.path : null;

  await pool.query(
    "INSERT INTO receipts (title, description, amount, image) VALUES ($1,$2,$3,$4)",
    [title, description, amount, image]
  );

  res.redirect("/admin/receipts/index");
};

/* SHOW EDIT FORM */
export const editReceiptPage = async (req, res) => {
  const receipt = await pool.query(
    "SELECT * FROM receipts WHERE id = $1",
    [req.params.id]
  );

  res.render("admin/receipts/edit", {
    receipt: receipt.rows[0]
  });
};

/* UPDATE RECEIPT */
export const updateReceipt = async (req, res) => {
  const { title, description, amount } = req.body;

  if (req.file) {
    await pool.query(
      "UPDATE receipts SET title=$1, description=$2, amount=$3, image=$4 WHERE id=$5",
      [title, description, amount, req.file.path, req.params.id]
    );
  } else {
    await pool.query(
      "UPDATE receipts SET title=$1, description=$2, amount=$3 WHERE id=$4",
      [title, description, amount, req.params.id]
    );
  }

  res.redirect("/admin/receipts/index");
};

/* DELETE RECEIPT */
export const deleteReceipt = async (req, res) => {
  await pool.query(
    "DELETE FROM receipts WHERE id = $1",
    [req.params.id]
  );

  res.redirect("/admin/receipts/index");
};