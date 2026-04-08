import pool from "../config/db.js";

export const getInvolvedPage = async (req, res) => {
  try {
    const ministriesResult = await pool.query(`
      SELECT id, name, slug, description
      FROM ministries
      WHERE is_active = TRUE
      ORDER BY display_order ASC, name ASC
    `);

    res.render("get-involved", {
      ministries: ministriesResult.rows,
      user: req.session.user
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading get involved page");
  }
};

export const contactPage = async (req, res) => {
  try {
    const selectedTeam = req.query.team || null;

    // Only load church contacts when not filtering for a specific ministry/team.
    // If the user requested a specific team, we should show only that ministry's
    // contacts and hide the global church contacts (per UI requirement).
    let churchContactsResult = { rows: [] };
    if (!selectedTeam) {
      churchContactsResult = await pool.query(`
        SELECT
          id,
          role_title,
          full_name,
          phone,
          whatsapp,
          email,
          portrait_url,
          notes
        FROM church_contacts
        WHERE is_active = TRUE
        ORDER BY display_order ASC, role_title ASC
      `);
    }

    let ministryQuery = `
      SELECT
        m.id AS ministry_id,
        m.name AS ministry_name,
        m.slug AS ministry_slug,
        m.description AS ministry_description,
        c.id AS contact_id,
        c.role_title,
        c.full_name,
        c.phone,
        c.whatsapp,
        c.email,
        c.portrait_url,
        c.notes,
        c.display_order AS contact_order
      FROM ministries m
      LEFT JOIN ministry_contacts c
        ON c.ministry_id = m.id
        AND c.is_active = TRUE
      WHERE m.is_active = TRUE
    `;

    const queryParams = [];

    if (selectedTeam) {
      queryParams.push(selectedTeam);
      ministryQuery += ` AND m.slug = $1`;
    }

    ministryQuery += `
      ORDER BY
        m.display_order ASC,
        m.name ASC,
        c.display_order ASC,
        c.role_title ASC
    `;

    const ministryRowsResult = await pool.query(ministryQuery, queryParams);

    const ministriesMap = new Map();

    for (const row of ministryRowsResult.rows) {
      if (!ministriesMap.has(row.ministry_id)) {
        ministriesMap.set(row.ministry_id, {
          id: row.ministry_id,
          name: row.ministry_name,
          slug: row.ministry_slug,
          description: row.ministry_description,
          contacts: []
        });
      }

      if (row.contact_id) {
        ministriesMap.get(row.ministry_id).contacts.push({
          id: row.contact_id,
          role_title: row.role_title,
          full_name: row.full_name,
          phone: row.phone,
          whatsapp: row.whatsapp,
          email: row.email,
          portrait_url: row.portrait_url,
          notes: row.notes
        });
      }
    }

    const ministries = Array.from(ministriesMap.values());

    res.render("contact", {
      churchContacts: churchContactsResult.rows,
      ministries,
      selectedTeam,
      user: req.session.user
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading contact page");
  }
};