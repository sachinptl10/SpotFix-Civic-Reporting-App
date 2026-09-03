const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `report-${uniqueSuffix}${ext}`);
  },
});

// File filter to accept images and short videos only
const fileFilter = (req, file, cb) => {
  const allowedImageExts = /jpeg|jpg|png|webp|heic/;
  const allowedVideoExts = /mp4|mov|m4v|webm/;

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const isImageMime = file.mimetype.startsWith('image/');
  const isVideoMime = file.mimetype.startsWith('video/');

  const isValidImage = allowedImageExts.test(ext) || isImageMime;
  const isValidVideo = allowedVideoExts.test(ext) || isVideoMime;

  if (isValidImage || isValidVideo) {
    cb(null, true);
  } else {
    cb(
      new Error('Unsupported file format! Please upload an image (JPEG, PNG, WEBP) or short video (MP4, MOV).'),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB maximum file size
  },
  fileFilter: fileFilter,
});

module.exports = upload;
