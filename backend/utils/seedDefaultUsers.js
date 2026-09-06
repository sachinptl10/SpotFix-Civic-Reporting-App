const User = require('../models/User');
const logger = require('./logger');

const DEFAULT_USERS = [
  {
    name: 'Municipal Administrator',
    email: 'admin@spotfix.gov',
    password: 'password123',
    role: 'government',
    isActive: true,
  },
  {
    name: 'Municipal Review Officer',
    email: 'gov@spotfix.gov',
    password: 'GovSpotFix@2026',
    role: 'government',
    isActive: true,
  },
  {
    name: 'Test Citizen',
    email: 'user@spotfix.com',
    password: 'password123',
    role: 'citizen',
    isActive: true,
  },
  {
    name: 'Civic Reporter',
    email: 'citizen@spotfix.com',
    password: 'password123',
    role: 'citizen',
    isActive: true,
  },
];

/**
 * Ensures demo users exist in the database with correct passwords & roles.
 */
const seedDefaultUsers = async () => {
  try {
    for (const u of DEFAULT_USERS) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        await User.create(u);
        logger.info(`[AutoSeed] Created default ${u.role} user: ${u.email}`);
      } else {
        // Ensure password and role are up to date
        existing.role = u.role;
        existing.isActive = true;
        existing.password = u.password; // Triggers pre-save bcrypt hash
        await existing.save();
        logger.info(`[AutoSeed] Verified/Updated default ${u.role} user: ${u.email}`);
      }
    }
  } catch (err) {
    logger.warn(`[AutoSeed] Failed to seed default users: ${err.message}`);
  }
};

module.exports = seedDefaultUsers;
