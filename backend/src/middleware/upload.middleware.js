// src/middleware/upload.middleware.js
const multer = require('multer');

// Cloudinary Auth — loaded lazily so the server still starts if packages aren't installed yet
let cloudinary;
let CloudinaryStorage;

try {
  cloudinary = require('cloudinary').v2;
  CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (error) {
  // Packages not installed — will return error on upload route
}

// Optional fallback if cloudinary isn't ready
const getStorage = () => {
  if (cloudinary && CloudinaryStorage) {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'jbadx_ads', // The folder name in your Cloudinary account
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 1200, crop: 'limit' }], // optimize large images
      },
    });
  }
  // Fallback to memory storage if packages are missing
  return multer.memoryStorage();
};

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
  }
};

const upload = multer({
  storage: getStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

module.exports = { upload, cloudinary };
