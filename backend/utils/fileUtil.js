const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

/**
 * Safely delete a file located inside the uploads directory.
 * Prevents directory traversal attacks by validating resolved path.
 */
const safeDeleteUploadFile = (relativeOrFilename) => {
  if (!relativeOrFilename) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      const filename = path.basename(relativeOrFilename);
      const targetPath = path.resolve(UPLOADS_DIR, filename);

      // Verify that targetPath is strictly inside UPLOADS_DIR
      if (!targetPath.startsWith(UPLOADS_DIR)) {
        logger.warn(`Attempted directory traversal in safeDeleteUploadFile: ${relativeOrFilename}`);
        return resolve(false);
      }

      fs.unlink(targetPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          logger.warn(`Failed to delete file ${targetPath}: ${err.message}`);
          return resolve(false);
        }
        resolve(true);
      });
    } catch (err) {
      logger.error(`Error in safeDeleteUploadFile: ${err.message}`);
      resolve(false);
    }
  });
};

module.exports = {
  safeDeleteUploadFile,
  UPLOADS_DIR,
};
