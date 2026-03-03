import express from 'express';
import { uploadHomeImages } from '../config/multer.js';
import { adminGetHomepageImages, adminEditHomepageImagePage, adminUpdateHomepageImage } from '../controllers/homepageImageController.js';
import { adminDeleteHomepageImage } from '../controllers/homepageImageController.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// List all homepage images
router.get('/admin/homepage-images', isAdmin, adminGetHomepageImages);

// Edit form for a section
router.get('/admin/homepage-images/:section/edit', isAdmin, adminEditHomepageImagePage);

// Update image for a section
router.post('/admin/homepage-images/:section/edit', isAdmin, uploadHomeImages.single('image'), adminUpdateHomepageImage);

// Delete image for a section (removes file and DB row)
router.post('/admin/homepage-images/:section/delete', isAdmin, adminDeleteHomepageImage);

export default router;
