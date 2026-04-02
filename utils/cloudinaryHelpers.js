import cloudinary from '../config/cloudinary.js';

// Extract public_id from a multer file object created by multer-storage-cloudinary.
export const getPublicIdFromFile = (file) => {
  if (!file) return null;
  // multer-storage-cloudinary typically sets `filename` to the Cloudinary public_id
  if (file.filename) return file.filename;
  if (file.public_id) return file.public_id;
  // Fallback: try to parse from the URL
  if (file.path) return parsePublicIdFromUrl(file.path);
  return null;
};

export const parsePublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const idx = url.indexOf('/upload/');
    if (idx === -1) return null;
    let tail = url.substring(idx + '/upload/'.length);
    // remove possible version segment like v12345678/\n    const vMatch = tail.match(/^v\d+\/(.*)$/);
    if (vMatch) tail = vMatch[1];
    // strip query string
    tail = tail.split('?')[0];
    // remove file extension
    const lastDot = tail.lastIndexOf('.');
    if (lastDot !== -1) tail = tail.substring(0, lastDot);
    return tail;
  } catch (err) {
    return null;
  }
};

export const destroyPublicId = async (publicId, resourceType = 'image') => {
  if (!publicId) return { result: 'no_public_id' };
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return res;
  } catch (err) {
    // Log a bit more context for debugging timeouts/Cloudinary errors, then rethrow.
    console.error('cloudinary destroyPublicId error', {
      timestamp: new Date().toISOString(),
      publicId,
      resourceType,
      message: err && err.message,
      name: err && err.name,
      http_code: err && err.http_code,
      stack: err && err.stack
    });
    throw err;
  }
};

export default {
  getPublicIdFromFile,
  parsePublicIdFromUrl,
  destroyPublicId
};
