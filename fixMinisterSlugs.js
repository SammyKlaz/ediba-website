import pool from "./config/db.js";
import slugify from "slugify";

const fixMinisterSlugs = async () => {
  try {
    // Get all ministers with NULL or empty slug
    const result = await pool.query(
      "SELECT id, name FROM ministers WHERE slug IS NULL OR slug = ''"
    );

    if (result.rows.length === 0) {
      console.log("✓ All ministers have valid slugs!");
      process.exit(0);
    }

    console.log(`Found ${result.rows.length} ministers with missing slugs.`);

    // Update each minister with a generated slug
    for (const minister of result.rows) {
      const slug = slugify(minister.name, {
        lower: true,
        strict: true
      });

      await pool.query(
        "UPDATE ministers SET slug = $1 WHERE id = $2",
        [slug, minister.id]
      );

      console.log(`✓ Updated ${minister.name} with slug: ${slug}`);
    }

    console.log("✓ All ministers updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing minister slugs:", error);
    process.exit(1);
  }
};

fixMinisterSlugs();
