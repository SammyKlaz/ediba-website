import pool from "../config/db.js";
import { getPublicIdFromFile, destroyPublicId } from "../utils/cloudinaryHelpers.js";

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
  const image_public_id = req.file ? getPublicIdFromFile(req.file) : null;

  await pool.query(
    "INSERT INTO receipts (title, description, amount, image, image_public_id) VALUES ($1,$2,$3,$4,$5)",
    [title, description, amount, image, image_public_id]
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
    const image_public_id = getPublicIdFromFile(req.file);
    await pool.query(
      "UPDATE receipts SET title=$1, description=$2, amount=$3, image=$4, image_public_id=$5 WHERE id=$6",
      [title, description, amount, req.file.path, image_public_id, req.params.id]
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
  try {
    const r = await pool.query("SELECT * FROM receipts WHERE id = $1", [req.params.id]);
    if (r.rows.length > 0) {
      const receipt = r.rows[0];
      try {
        if (receipt.image_public_id) await destroyPublicId(receipt.image_public_id, 'image');
        else {
          const parsed = getPublicIdFromFile({ path: receipt.image });
          if (parsed) await destroyPublicId(parsed, 'image');
        }
      } catch (err) {
        console.warn('Error deleting receipt image from Cloudinary', err);
      }
    }

    await pool.query(
      "DELETE FROM receipts WHERE id = $1",
      [req.params.id]
    );

    res.redirect("/admin/receipts/index");
  } catch (err) {
    console.error(err);
    res.redirect('/admin/receipts/index');
  }
};