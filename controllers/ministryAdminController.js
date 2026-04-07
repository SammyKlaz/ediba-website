import pool from "../config/db.js";
import { getPublicIdFromFile, destroyPublicId } from "../utils/cloudinaryHelpers.js";

function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ======================= ADMIN MINISTRIES ======================= */

export const adminMinistriesPage = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM ministries
      ORDER BY display_order ASC, name ASC
    `);

    res.render("admin/ministries/index", {
      ministries: result.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error("adminMinistriesPage error:", error);
    res.send("Error loading ministries");
  }
};

export const newMinistryPage = (req, res) => {
  res.render("admin/ministries/new", {
    user: req.session.user
  });
};

export const createMinistry = async (req, res) => {
  try {
    const { name, description, display_order, is_active } = req.body;
    const slug = generateSlug(name);

    await pool.query(
      `
      INSERT INTO ministries (name, slug, description, display_order, is_active)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        name,
        slug,
        description || null,
        Number(display_order) || 0,
        is_active === "true"
      ]
    );

    res.redirect("/admin/ministries");
  } catch (error) {
    console.error("createMinistry error:", error);
    res.send("Error creating ministry");
  }
};

export const editMinistryPage = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT * FROM ministries WHERE slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Ministry not found");
    }

    res.render("admin/ministries/edit", {
      ministry: result.rows[0],
      user: req.session.user
    });
  } catch (error) {
    console.error("editMinistryPage error:", error);
    res.send("Error loading ministry");
  }
};

export const updateMinistry = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, description, display_order, is_active } = req.body;
    const newSlug = generateSlug(name);

    await pool.query(
      `
      UPDATE ministries
      SET name = $1,
          slug = $2,
          description = $3,
          display_order = $4,
          is_active = $5,
          updated_at = NOW()
      WHERE slug = $6
    `,
      [
        name,
        newSlug,
        description || null,
        Number(display_order) || 0,
        is_active === "true",
        slug
      ]
    );

    res.redirect("/admin/ministries");
  } catch (error) {
    console.error("updateMinistry error:", error);
    res.send("Error updating ministry");
  }
};

export const deleteMinistry = async (req, res) => {
  const { slug } = req.params;

  try {
    const ministryResult = await pool.query(
      `SELECT * FROM ministries WHERE slug = $1`,
      [slug]
    );

    if (ministryResult.rows.length === 0) {
      return res.redirect("/admin/ministries");
    }

    const ministry = ministryResult.rows[0];

    const contactsResult = await pool.query(
      `SELECT * FROM ministry_contacts WHERE ministry_id = $1`,
      [ministry.id]
    );

    for (const contact of contactsResult.rows) {
      try {
        if (contact.portrait_public_id) {
          await destroyPublicId(contact.portrait_public_id, "image");
        } else if (contact.portrait_url) {
          const parsed = getPublicIdFromFile({ path: contact.portrait_url });
          if (parsed) {
            await destroyPublicId(parsed, "image");
          }
        }
      } catch (err) {
        console.warn("Error deleting ministry contact portrait from Cloudinary", err);
      }
    }

    await pool.query(`DELETE FROM ministries WHERE slug = $1`, [slug]);

    res.redirect("/admin/ministries");
  } catch (error) {
    console.error("deleteMinistry error:", error);
    res.send("Error deleting ministry");
  }
};

/* ======================= ADMIN CHURCH CONTACTS ======================= */

export const adminChurchContactsPage = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM church_contacts
      ORDER BY display_order ASC, role_title ASC
    `);

    res.render("admin/church-contacts/index", {
      contacts: result.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error("adminChurchContactsPage error:", error);
    res.send("Error loading church contacts");
  }
};

export const newChurchContactPage = (req, res) => {
  res.render("admin/church-contacts/new", {
    user: req.session.user
  });
};

export const createChurchContact = async (req, res) => {
  try {
    const {
      role_title,
      full_name,
      phone,
      whatsapp,
      email,
      notes,
      display_order,
      is_active
    } = req.body;

    const portrait_url = req.file ? req.file.path : null;
    const portrait_public_id = req.file ? getPublicIdFromFile(req.file) : null;

    await pool.query(
      `
      INSERT INTO church_contacts
      (role_title, full_name, phone, whatsapp, email, portrait_url, portrait_public_id, notes, display_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        role_title,
        full_name,
        phone || null,
        whatsapp || null,
        email || null,
        portrait_url,
        portrait_public_id,
        notes || null,
        Number(display_order) || 0,
        is_active === "true"
      ]
    );

    res.redirect("/admin/church-contacts");
  } catch (error) {
    console.error("createChurchContact error:", error);
    res.send("Error creating church contact");
  }
};

export const editChurchContactPage = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM church_contacts WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Church contact not found");
    }

    res.render("admin/church-contacts/edit", {
      contact: result.rows[0],
      user: req.session.user
    });
  } catch (error) {
    console.error("editChurchContactPage error:", error);
    res.send("Error loading church contact");
  }
};

export const updateChurchContact = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      role_title,
      full_name,
      phone,
      whatsapp,
      email,
      notes,
      display_order,
      is_active
    } = req.body;

    const existingResult = await pool.query(
      `SELECT * FROM church_contacts WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).send("Church contact not found");
    }

    const existing = existingResult.rows[0];

    let portrait_url = existing.portrait_url;
    let portrait_public_id = existing.portrait_public_id;

    if (req.file) {
      try {
        if (existing.portrait_public_id) {
          await destroyPublicId(existing.portrait_public_id, "image");
        } else if (existing.portrait_url) {
          const parsed = getPublicIdFromFile({ path: existing.portrait_url });
          if (parsed) {
            await destroyPublicId(parsed, "image");
          }
        }
      } catch (err) {
        console.warn("Error deleting old church contact portrait from Cloudinary", err);
      }

      portrait_url = req.file.path;
      portrait_public_id = getPublicIdFromFile(req.file);
    }

    await pool.query(
      `
      UPDATE church_contacts
      SET role_title = $1,
          full_name = $2,
          phone = $3,
          whatsapp = $4,
          email = $5,
          portrait_url = $6,
          portrait_public_id = $7,
          notes = $8,
          display_order = $9,
          is_active = $10,
          updated_at = NOW()
      WHERE id = $11
    `,
      [
        role_title,
        full_name,
        phone || null,
        whatsapp || null,
        email || null,
        portrait_url,
        portrait_public_id,
        notes || null,
        Number(display_order) || 0,
        is_active === "true",
        id
      ]
    );

    res.redirect("/admin/church-contacts");
  } catch (error) {
    console.error("updateChurchContact error:", error);
    res.send("Error updating church contact");
  }
};

export const deleteChurchContact = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM church_contacts WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.redirect("/admin/church-contacts");
    }

    const contact = result.rows[0];

    try {
      if (contact.portrait_public_id) {
        await destroyPublicId(contact.portrait_public_id, "image");
      } else if (contact.portrait_url) {
        const parsed = getPublicIdFromFile({ path: contact.portrait_url });
        if (parsed) {
          await destroyPublicId(parsed, "image");
        }
      }
    } catch (err) {
      console.warn("Error deleting church contact portrait from Cloudinary", err);
    }

    await pool.query(`DELETE FROM church_contacts WHERE id = $1`, [id]);

    res.redirect("/admin/church-contacts");
  } catch (error) {
    console.error("deleteChurchContact error:", error);
    res.send("Error deleting church contact");
  }
};

/* ======================= ADMIN MINISTRY CONTACTS ======================= */

export const adminMinistryContactsPage = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT mc.*, m.name AS ministry_name, m.slug AS ministry_slug
      FROM ministry_contacts mc
      JOIN ministries m ON mc.ministry_id = m.id
      ORDER BY m.display_order ASC, mc.display_order ASC, mc.role_title ASC
    `);

    res.render("admin/ministry-contacts/index", {
      contacts: result.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error("adminMinistryContactsPage error:", error);
    res.send("Error loading ministry contacts");
  }
};

export const newMinistryContactPage = async (req, res) => {
  try {
    const ministriesResult = await pool.query(`
      SELECT id, name, slug
      FROM ministries
      ORDER BY display_order ASC, name ASC
    `);

    res.render("admin/ministry-contacts/new", {
      ministries: ministriesResult.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error("newMinistryContactPage error:", error);
    res.send("Error loading new ministry contact page");
  }
};

export const createMinistryContact = async (req, res) => {
  try {
    const {
      ministry_id,
      role_title,
      full_name,
      phone,
      whatsapp,
      email,
      notes,
      display_order,
      is_active
    } = req.body;

    const portrait_url = req.file ? req.file.path : null;
    const portrait_public_id = req.file ? getPublicIdFromFile(req.file) : null;

    await pool.query(
      `
      INSERT INTO ministry_contacts
      (ministry_id, role_title, full_name, phone, whatsapp, email, portrait_url, portrait_public_id, notes, display_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
      [
        Number(ministry_id),
        role_title,
        full_name,
        phone || null,
        whatsapp || null,
        email || null,
        portrait_url,
        portrait_public_id,
        notes || null,
        Number(display_order) || 0,
        is_active === "true"
      ]
    );

    res.redirect("/admin/ministry-contacts");
  } catch (error) {
    console.error("createMinistryContact error:", error);
    res.send("Error creating ministry contact");
  }
};

export const editMinistryContactPage = async (req, res) => {
  try {
    const { id } = req.params;

    const contactResult = await pool.query(
      `SELECT * FROM ministry_contacts WHERE id = $1`,
      [id]
    );

    const ministriesResult = await pool.query(`
      SELECT id, name, slug
      FROM ministries
      ORDER BY display_order ASC, name ASC
    `);

    if (contactResult.rows.length === 0) {
      return res.status(404).send("Ministry contact not found");
    }

    res.render("admin/ministry-contacts/edit", {
      contact: contactResult.rows[0],
      ministries: ministriesResult.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error("editMinistryContactPage error:", error);
    res.send("Error loading ministry contact");
  }
};

export const updateMinistryContact = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ministry_id,
      role_title,
      full_name,
      phone,
      whatsapp,
      email,
      notes,
      display_order,
      is_active
    } = req.body;

    const existingResult = await pool.query(
      `SELECT * FROM ministry_contacts WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).send("Ministry contact not found");
    }

    const existing = existingResult.rows[0];

    let portrait_url = existing.portrait_url;
    let portrait_public_id = existing.portrait_public_id;

    if (req.file) {
      try {
        if (existing.portrait_public_id) {
          await destroyPublicId(existing.portrait_public_id, "image");
        } else if (existing.portrait_url) {
          const parsed = getPublicIdFromFile({ path: existing.portrait_url });
          if (parsed) {
            await destroyPublicId(parsed, "image");
          }
        }
      } catch (err) {
        console.warn("Error deleting old ministry contact portrait from Cloudinary", err);
      }

      portrait_url = req.file.path;
      portrait_public_id = getPublicIdFromFile(req.file);
    }

    await pool.query(
      `
      UPDATE ministry_contacts
      SET ministry_id = $1,
          role_title = $2,
          full_name = $3,
          phone = $4,
          whatsapp = $5,
          email = $6,
          portrait_url = $7,
          portrait_public_id = $8,
          notes = $9,
          display_order = $10,
          is_active = $11,
          updated_at = NOW()
      WHERE id = $12
    `,
      [
        Number(ministry_id),
        role_title,
        full_name,
        phone || null,
        whatsapp || null,
        email || null,
        portrait_url,
        portrait_public_id,
        notes || null,
        Number(display_order) || 0,
        is_active === "true",
        id
      ]
    );

    res.redirect("/admin/ministry-contacts");
  } catch (error) {
    console.error("updateMinistryContact error:", error);
    res.send("Error updating ministry contact");
  }
};

export const deleteMinistryContact = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM ministry_contacts WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.redirect("/admin/ministry-contacts");
    }

    const contact = result.rows[0];

    try {
      if (contact.portrait_public_id) {
        await destroyPublicId(contact.portrait_public_id, "image");
      } else if (contact.portrait_url) {
        const parsed = getPublicIdFromFile({ path: contact.portrait_url });
        if (parsed) {
          await destroyPublicId(parsed, "image");
        }
      }
    } catch (err) {
      console.warn("Error deleting ministry contact portrait from Cloudinary", err);
    }

    await pool.query(`DELETE FROM ministry_contacts WHERE id = $1`, [id]);

    res.redirect("/admin/ministry-contacts");
  } catch (error) {
    console.error("deleteMinistryContact error:", error);
    res.send("Error deleting ministry contact");
  }
};