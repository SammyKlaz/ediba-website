import pool from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { getPublicIdFromFile, destroyPublicId } from '../utils/cloudinaryHelpers.js';

// Fetch all homepage images (for rendering on home page)
export const getHomepageImages = async () => {
  try {
    const result = await pool.query('SELECT * FROM homepage_images');
    const images = {};

    result.rows.forEach(img => {
      // normalize old '/uploads/homepage/...' to '/uploads/home/...'
      if (img.file_path && img.file_path.includes('/uploads/homepage/')) {
        const filename = path.basename(img.file_path);
        const altPath = `/uploads/home/${filename}`;
        const altFsPath = path.join(
          process.cwd(),
          'public',
          'uploads',
          'home',
          filename
        );

        if (fs.existsSync(altFsPath)) {
          img.file_path = altPath;
        }
      }

      images[img.section] = img;
    });

    return images;
  } catch (error) {
    console.error('Error fetching homepage images:', error);
    return {};
  }
};

// Admin: Get all images for management
export const adminGetHomepageImages = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM homepage_images ORDER BY section'
    );

    const sections = ['hero', 'about', 'mca', 'womens_guild', 'cgit', 'pypan'];
    const rows = result.rows;

    const displayRows = sections.map(sec => {
      const found = rows.find(r => r.section === sec);
      return found || { section: sec, file_path: null, alt_text: '' };
    });

    res.render('admin/homepage-images', { images: displayRows });
  } catch (error) {
    console.error('Error loading homepage images admin page:', error);
    req.flash('error', 'Unable to load homepage images.');
    res.render('admin/homepage-images', { images: [] });
  }
};

// Admin: Render edit form for a section
export const adminEditHomepageImagePage = async (req, res) => {
  try {
    const { section } = req.params;
    const result = await pool.query(
      'SELECT * FROM homepage_images WHERE section = $1',
      [section]
    );

    res.render('admin/edit-homepage-image', {
      image: result.rows[0],
      section
    });
  } catch (error) {
    console.error(
      'Error loading edit page for section',
      req.params.section,
      error
    );
    req.flash('error', 'Unable to load edit page.');
    res.redirect('/admin/homepage-images');
  }
};

// Admin: Update/upload image for a section
export const adminUpdateHomepageImage = async (req, res) => {
  console.log("CONTROLLER HIT");
  console.log("req.file =", req.file);
  console.log("req.body =", req.body);

  const columns = await pool.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'homepage_images'
`);

console.log("COLUMNS:", columns.rows);

  try {
    const { section } = req.params;
    const { alt_text } = req.body;

    const existing = await pool.query(
      'SELECT * FROM homepage_images WHERE section = $1',
      [section]
    );

    const oldRecord = existing.rows[0];

    const file_path = req.file
      ? req.file.path
      : oldRecord?.file_path || null;

    const public_id = req.file
      ? getPublicIdFromFile(req.file)
      : oldRecord?.public_id || null;

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE homepage_images
         SET file_path = $1,
             alt_text = $2,
             public_id = $3,
             updated_at = NOW()
         WHERE section = $4`,
        [file_path, alt_text, public_id, section]
      );
    } else {
      await pool.query(
        `INSERT INTO homepage_images
         (section, file_path, alt_text, public_id)
         VALUES ($1, $2, $3, $4)`,
        [section, file_path, alt_text, public_id]
      );
    }

    req.flash('success', 'Image updated successfully!');
    res.redirect('/admin/homepage-images');
  } catch (error) {
    console.error('Error updating homepage image:', error);
    req.flash('error', 'Unable to update image.');
    res.redirect('/admin/homepage-images');
  }
};

// Admin: Delete image
export const adminDeleteHomepageImage = async (req, res) => {
  try {
    const { section } = req.params;

    const result = await pool.query(
      'SELECT * FROM homepage_images WHERE section = $1',
      [section]
    );

    if (result.rows.length === 0) {
      req.flash('error', 'No image found to delete.');
      return res.redirect('/admin/homepage-images');
    }

    const img = result.rows[0];

    try {
      if (img.public_id) {
        await destroyPublicId(img.public_id, 'image');
      } else if (img.file_path) {
        const parsed = getPublicIdFromFile({ path: img.file_path });
        if (parsed) {
          await destroyPublicId(parsed, 'image');
        }
      }
    } catch (err) {
      console.warn('Error deleting homepage image from Cloudinary', err);
    }

    await pool.query(
      'DELETE FROM homepage_images WHERE section = $1',
      [section]
    );

    req.flash('success', 'Image deleted successfully.');
    res.redirect('/admin/homepage-images');
  } catch (error) {
    console.error('Error deleting homepage image:', error);
    req.flash('error', 'Unable to delete image.');
    res.redirect('/admin/homepage-images');
  }
};