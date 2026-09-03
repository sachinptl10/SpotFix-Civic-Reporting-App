const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

// Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration with cryptographically secure random names
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const randomBytes = crypto.randomBytes(12).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `spotfix-${Date.now()}-${randomBytes}${ext}`);
  },
});

// Whitelist file filter for civic photos and evidence videos
const fileFilter = (req, file, cb) => {
  const allowedImageExts = /jpeg|jpg|png|webp|heic/;
  const allowedVideoExts = /mp4|mov|m4v|webm/;

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const isImageMime = file.mimetype.startsWith('image/');
  const isVideoMime = file.mimetype.startsWith('video/');

  const isValidImage = allowedImageExts.test(ext) && isImageMime;
  const isValidVideo = allowedVideoExts.test(ext) && isVideoMime;

  if (isValidImage || isValidVideo) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only standard images (JPEG, PNG, WEBP) and videos (MP4, MOV) are accepted.',
        415
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB limit
    files: 1, // Single file per upload request
  },
  fileFilter: fileFilter,
});

module.exports = upload;
