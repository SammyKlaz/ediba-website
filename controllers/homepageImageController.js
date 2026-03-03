import pool from '../config/db.js';
import path from 'path';
import fs from 'fs';

// Fetch all homepage images (for rendering on home page)
export const getHomepageImages = async () => {
  try {
    const result = await pool.query('SELECT * FROM homepage_images');
    const images = {};
    result.rows.forEach(img => {
      // normalize old '/uploads/homepage/...' to '/uploads/home/...' if file exists in home
      if (img.file_path && img.file_path.includes('/uploads/homepage/')) {
        const filename = path.basename(img.file_path);
        const altPath = `/uploads/home/${filename}`;
        const altFsPath = path.join(process.cwd(), 'public', 'uploads', 'home', filename);
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
    const result = await pool.query('SELECT * FROM homepage_images ORDER BY section');

    // Ensure all expected sections are present for admin convenience
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
    const result = await pool.query('SELECT * FROM homepage_images WHERE section = $1', [section]);
    res.render('admin/edit-homepage-image', { image: result.rows[0], section });
  } catch (error) {
    console.error('Error loading edit page for section', req.params.section, error);
    req.flash('error', 'Unable to load edit page.');
    res.redirect('/admin/homepage-images');
  }
};

// Admin: Update/upload image for a section
export const adminUpdateHomepageImage = async (req, res) => {
  try {
    const { section } = req.params;
    const { alt_text } = req.body;
    const file_path = req.file ? `/uploads/home/${req.file.filename}` : req.body.current_file_path || null;

    // Check if record exists
    const existing = await pool.query('SELECT id FROM homepage_images WHERE section = $1', [section]);

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE homepage_images SET file_path = $1, alt_text = $2, updated_at = NOW() WHERE section = $3`,
        [file_path, alt_text, section]
      );
    } else {
      await pool.query(
        `INSERT INTO homepage_images (section, file_path, alt_text) VALUES ($1, $2, $3)`,
        [section, file_path, alt_text]
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

// Admin: Delete image (remove file from disk and delete DB record)
export const adminDeleteHomepageImage = async (req, res) => {
  try {
    const { section } = req.params;
    const result = await pool.query('SELECT * FROM homepage_images WHERE section = $1', [section]);
    if (result.rows.length === 0) {
      req.flash('error', 'No image found to delete.');
      return res.redirect('/admin/homepage-images');
    }

    const img = result.rows[0];
    if (img.file_path) {
      // resolve possible legacy paths
      let filename = '';
      if (img.file_path.includes('/uploads/home/')) filename = path.basename(img.file_path);
      else if (img.file_path.includes('/uploads/homepage/')) filename = path.basename(img.file_path);

      if (filename) {
        const fsPath = path.join(process.cwd(), 'public', 'uploads', 'home', filename);
        if (fs.existsSync(fsPath)) {
          try { fs.unlinkSync(fsPath); } catch (err) { console.warn('Could not delete file', fsPath, err); }
        }
      }
    }

    // remove DB record for that section
    await pool.query('DELETE FROM homepage_images WHERE section = $1', [section]);

    req.flash('success', 'Image deleted successfully.');
    res.redirect('/admin/homepage-images');
  } catch (error) {
    console.error('Error deleting homepage image:', error);
    req.flash('error', 'Unable to delete image.');
    res.redirect('/admin/homepage-images');
  }
};
