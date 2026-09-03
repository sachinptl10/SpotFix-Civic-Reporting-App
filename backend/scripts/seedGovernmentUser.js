const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const seedGovernment = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spotfix';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB at', mongoUri);

    const govEmail = (process.env.GOV_EMAIL || 'gov@spotfix.gov').toLowerCase().trim();
    const govPassword = process.env.GOV_PASSWORD || 'GovSpotFix@2026';
    const govName = process.env.GOV_NAME || 'Municipal Review Officer';

    let user = await User.findOne({ email: govEmail });

    if (user) {
      console.log(`[Seed] User ${govEmail} already exists. Updating role to government...`);
      user.role = 'government';
      user.isActive = true;
      user.name = govName;
      user.password = govPassword; // Will trigger pre-save bcrypt hash
      await user.save();
      console.log('[Seed] Government account successfully updated!');
    } else {
      console.log(`[Seed] Creating new government account for ${govEmail}...`);
      user = await User.create({
        name: govName,
        email: govEmail,
        password: govPassword,
        role: 'government',
        isActive: true,
      });
      console.log('[Seed] Government account created successfully!');
    }

    console.log('----------------------------------------------------');
    console.log('GOVERNMENT CREDENTIALS:');
    console.log(`Email:    ${govEmail}`);
    console.log(`Password: ${govPassword}`);
    console.log(`Role:     ${user.role}`);
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding government user:', error);
    process.exit(1);
  }
};

seedGovernment();
