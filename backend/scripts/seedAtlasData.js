const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Report = require('../models/Report');
const Notification = require('../models/Notification');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI is missing from backend/.env');
  process.exit(1);
}

const seedAtlas = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log(`URI: ${MONGO_URI.replace(/:([^@]+)@/, ':****@')}`);

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log('Successfully connected to MongoDB Atlas!');
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);

    // 1. Ensure core users exist
    console.log('\n--- 1. Ensuring Users in Atlas ---');

    const usersToCreate = [
      {
        name: 'Municipal Admin',
        email: 'admin@spotfix.gov',
        password: 'password123',
        role: 'government',
        phone: '+91 80 2222 1111',
        isActive: true,
      },
      {
        name: 'Chief Civic Review Officer',
        email: 'gov@spotfix.gov',
        password: 'GovSpotFix@2026',
        role: 'government',
        phone: '+91 80 2222 2222',
        isActive: true,
      },
      {
        name: 'Kavita Rao (Citizen)',
        email: 'citizen@spotfix.com',
        password: 'password123',
        role: 'citizen',
        phone: '+91 98450 12345',
        isActive: true,
      },
      {
        name: 'Arjun Nair (Citizen)',
        email: 'user@spotfix.com',
        password: 'password123',
        role: 'citizen',
        phone: '+91 98860 67890',
        isActive: true,
      },
      {
        name: 'Priya Sundaram',
        email: 'priya.sundaram@spotfix.org',
        password: 'password123',
        role: 'citizen',
        phone: '+91 98765 43210',
        isActive: true,
      },
    ];

    const userDocs = {};
    for (const u of usersToCreate) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        existing = await User.create(u);
        console.log(`  [+] Created User: ${existing.email} (Role: ${existing.role}, ID: ${existing._id})`);
      } else {
        existing.role = u.role;
        existing.password = u.password;
        existing.isActive = true;
        await existing.save();
        console.log(`  [=] Verified User: ${existing.email} (Role: ${existing.role}, ID: ${existing._id})`);
      }
      userDocs[u.email] = existing;
    }

    const citizenA = userDocs['citizen@spotfix.com'];
    const citizenB = userDocs['user@spotfix.com'];
    const citizenC = userDocs['priya.sundaram@spotfix.org'];
    const govOfficer = userDocs['gov@spotfix.gov'];
    const adminOfficer = userDocs['admin@spotfix.gov'];

    // 2. Clear old seeded sample reports to avoid duplicate clutter if run repeatedly
    console.log('\n--- 2. Seeding Civic Issue Reports into Atlas ---');

    const sampleReports = [
      {
        reportNumber: 'SF-2026-1001',
        user: citizenA._id,
        title: 'Massive Crater Pothole on Outer Ring Road Flyover',
        description: 'Deep asphalt depression causing heavy traffic slowdowns and severe accident risk for two-wheelers during monsoon rains.',
        category: 'roads',
        status: 'pending',
        priority: 'high',
        latitude: 12.9372,
        longitude: 77.6912,
        address: 'Outer Ring Road, near Kadubeesanahalli Underpass, Ward 85, Bengaluru',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        statusHistory: [
          {
            status: 'pending',
            note: 'Issue reported by citizen with geo-tagged high-resolution photograph.',
            changedBy: citizenA._id,
            timestamp: new Date(Date.now() - 4 * 3600 * 1000),
          },
        ],
      },
      {
        reportNumber: 'SF-2026-1002',
        user: citizenB._id,
        title: 'Overflowing Commercial Garbage Dumpster Blocking Sidewalk',
        description: 'Commercial waste accumulating outside local market for 4 days. Strong odor and stray animal menace obstructing pedestrians.',
        category: 'sanitation',
        status: 'under_review',
        priority: 'medium',
        latitude: 12.9719,
        longitude: 77.6412,
        address: '12th Main Road, HAL 2nd Stage, Indiranagar, Ward 112, Bengaluru',
        imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80',
        reviewedBy: govOfficer._id,
        reviewNote: 'Assigned to East Zone Sanitation Inspector for on-site inspection.',
        statusHistory: [
          {
            status: 'pending',
            note: 'Issue reported by citizen.',
            changedBy: citizenB._id,
            timestamp: new Date(Date.now() - 24 * 3600 * 1000),
          },
          {
            status: 'under_review',
            note: 'Assigned to East Zone Sanitation Inspector for on-site inspection.',
            changedBy: govOfficer._id,
            timestamp: new Date(Date.now() - 18 * 3600 * 1000),
          },
        ],
      },
      {
        reportNumber: 'SF-2026-1003',
        user: citizenC._id,
        title: 'Continuous Blackout from 5 Broken Streetlights near Girls High School',
        description: 'Streetlights unlit for 6 consecutive nights. Area is completely dark, causing safety concerns for students attending evening tuition classes.',
        category: 'electricity',
        status: 'approved',
        priority: 'high',
        latitude: 12.925,
        longitude: 77.5806,
        address: '9th Cross, 2nd Block, Jayanagar, Ward 154, Bengaluru',
        imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80',
        reviewedBy: govOfficer._id,
        reviewNote: 'Priority approval granted. Electrical maintenance crew dispatched with bucket truck.',
        statusHistory: [
          {
            status: 'pending',
            note: 'Issue reported by citizen.',
            changedBy: citizenC._id,
            timestamp: new Date(Date.now() - 48 * 3600 * 1000),
          },
          {
            status: 'under_review',
            note: 'Under triage by Public Works Electrical division.',
            changedBy: govOfficer._id,
            timestamp: new Date(Date.now() - 36 * 3600 * 1000),
          },
          {
            status: 'approved',
            note: 'Work Order #WO-EL-8842 issued to South Division Maintenance Unit.',
            changedBy: govOfficer._id,
            timestamp: new Date(Date.now() - 12 * 3600 * 1000),
          },
        ],
      },
      {
        reportNumber: 'SF-2026-1004',
        user: citizenA._id,
        title: 'Main Municipal Potable Water Pipeline Rupture Flooding Road',
        description: 'High pressure drinking water pipe burst flooding road and wasting thousands of liters of clean water.',
        category: 'water',
        status: 'resolved',
        priority: 'high',
        latitude: 12.9352,
        longitude: 77.6208,
        address: '4th Cross, 5th Block, Koramangala, Ward 151, Bengaluru',
        imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
        reviewedBy: govOfficer._id,
        reviewNote: 'Emergency pipeline replacement approved and scheduled immediately.',
        resolvedImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
        resolutionNote: 'Main water conduit valve replaced, cast iron sleeve welded, pressure tested, and road repaved.',
        resolvedAt: new Date(Date.now() - 2 * 3600 * 1000),
        statusHistory: [
          {
            status: 'pending',
            note: 'Urgent citizen submission with photo evidence.',
            changedBy: citizenA._id,
            timestamp: new Date(Date.now() - 72 * 3600 * 1000),
          },
          {
            status: 'under_review',
            note: 'Triage officer flagged as critical emergency.',
            changedBy: govOfficer._id,
            timestamp: new Date(Date.now() - 60 * 3600 * 1000),
          },
          {
            status: 'approved',
            note: 'Rapid repair crew authorized for immediate excavation.',
            changedBy: govOfficer._id,
            timestamp: new Date(Date.now() - 48 * 3600 * 1000),
          },
          {
            status: 'resolved',
            note: 'Main water conduit valve replaced, cast iron sleeve welded, pressure tested, and road repaved.',
            changedBy: govOfficer._id,
            timestamp: new Date(Date.now() - 2 * 3600 * 1000),
          },
        ],
      },
      {
        reportNumber: 'SF-2026-1005',
        user: citizenB._id,
        title: 'Clogged Stormwater Drain Cover Filled with Construction Debris',
        description: 'Silt and building sand dumped into stormwater inlet grating. Water backs up quickly during heavy rain.',
        category: 'drainage',
        status: 'pending',
        priority: 'medium',
        latitude: 12.9081,
        longitude: 77.6322,
        address: '24th Main Road, Sector 2, HSR Layout, Ward 174, Bengaluru',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
        statusHistory: [
          {
            status: 'pending',
            note: 'Issue reported by citizen.',
            changedBy: citizenB._id,
            timestamp: new Date(Date.now() - 10 * 3600 * 1000),
          },
        ],
      },
      {
        reportNumber: 'SF-2026-1006',
        user: citizenC._id,
        title: 'Damaged Park Bench inside Private Apartment Complex',
        description: 'Wooden slats on park bench broken in private internal clubhouse garden.',
        category: 'public-property',
        status: 'rejected',
        priority: 'low',
        latitude: 12.985,
        longitude: 77.6534,
        address: 'Green Meadows Enclave, Whitefield, Ward 84, Bengaluru',
        imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80',
        reviewedBy: adminOfficer._id,
        reviewNote: 'Location is inside private gated residential property. SpotFix municipal services only cover public municipal property and right-of-way.',
        statusHistory: [
          {
            status: 'pending',
            note: 'Issue reported by citizen.',
            changedBy: citizenC._id,
            timestamp: new Date(Date.now() - 96 * 3600 * 1000),
          },
          {
            status: 'under_review',
            note: 'Triage officer checking cadastral property boundaries.',
            changedBy: adminOfficer._id,
            timestamp: new Date(Date.now() - 80 * 3600 * 1000),
          },
          {
            status: 'rejected',
            note: 'Location is inside private gated residential property. SpotFix municipal services only cover public municipal property.',
            changedBy: adminOfficer._id,
            timestamp: new Date(Date.now() - 72 * 3600 * 1000),
          },
        ],
      },
      {
        reportNumber: 'SF-2026-1007',
        user: citizenA._id,
        title: 'Dangerous Missing Manhole Cover on Busy Pedestrian Crosswalk',
        description: 'Open circular drainage pit right on the zebra crossing. Multiple pedestrians nearly stepped into the 8-foot drop.',
        category: 'drainage',
        status: 'resolved',
        priority: 'high',
        latitude: 12.9611,
        longitude: 77.5738,
        address: 'Lalbagh West Gate Road, Basavanagudi, Ward 143, Bengaluru',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
        reviewedBy: govOfficer._id,
        reviewNote: 'High safety hazard; emergency steel cover dispatched immediately.',
        resolvedImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
        resolutionNote: 'Heavy duty ductile iron cover installed with anti-theft locking latch and concrete collar sealed.',
        resolvedAt: new Date(Date.now() - 8 * 3600 * 1000),
        statusHistory: [
          {
            status: 'pending',
            note: 'Reported by citizen.',
            changedBy: citizenA._id,
            timestamp: new Date(Date.now() - 30 * 3600 * 1000),
          },
          {
            status: 'under_review',
            note: 'Emergency protocol triggered.',
            changedBy: govOfficer._id,
            timestamp: new Date(Date.now() - 25 * 3600 * 1000),
          },
          {
            status: 'approved',
            note: 'Work Order #WO-DR-4912 assigned to field team.',
            changedBy: govOfficer._id,
            timestamp: new Date(Date.now() - 20 * 3600 * 1000),
          },
          {
            status: 'resolved',
            note: 'Heavy duty ductile iron cover installed with anti-theft locking latch and concrete collar sealed.',
            changedBy: govOfficer._id,
            timestamp: new Date(Date.now() - 8 * 3600 * 1000),
          },
        ],
      },
      {
        reportNumber: 'SF-2026-1008',
        user: citizenB._id,
        title: 'Large Fallen Tree Branch Blocking Bus Lane on MG Road',
        description: 'Heavy thunderstorm caused large tree branch to fracture and fall across entire left traffic lane.',
        category: 'roads',
        status: 'under_review',
        priority: 'high',
        latitude: 12.9784,
        longitude: 77.6001,
        address: 'MG Road, near Metro Pillar 142, Ward 110, Bengaluru',
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
        reviewedBy: govOfficer._id,
        reviewNote: 'Forest & Horticulture quick response chainsaw vehicle dispatched.',
        statusHistory: [
          {
            status: 'pending',
            note: 'Reported via mobile application.',
            changedBy: citizenB._id,
            timestamp: new Date(Date.now() - 3 * 3600 * 1000),
          },
          {
            status: 'under_review',
            note: 'Forest & Horticulture quick response chainsaw vehicle dispatched.',
            changedBy: govOfficer._id,
            timestamp: new Date(Date.now() - 1 * 3600 * 1000),
          },
        ],
      },
    ];

    const savedReports = [];
    for (const r of sampleReports) {
      let doc = await Report.findOne({ reportNumber: r.reportNumber });
      if (!doc) {
        doc = await Report.create(r);
        console.log(`  [+] Inserted Report: ${doc.reportNumber} | "${doc.title}" | Status: [${doc.status}] | ID: ${doc._id}`);
      } else {
        Object.assign(doc, r);
        await doc.save();
        console.log(`  [=] Updated Report: ${doc.reportNumber} | "${doc.title}" | Status: [${doc.status}] | ID: ${doc._id}`);
      }
      savedReports.push(doc);
    }

    // 3. Seed Citizen Notifications
    console.log('\n--- 3. Seeding Citizen Notification Alerts into Atlas ---');

    const sampleNotifications = [
      {
        userId: citizenA._id,
        reportId: savedReports[3]._id, // Potable water pipe resolved
        type: 'resolved',
        message: 'Your report #SF-2026-1004 (Main Municipal Potable Water Pipeline Rupture) has been marked as RESOLVED! Thank you for helping improve the city.',
        isRead: false,
      },
      {
        userId: citizenC._id,
        reportId: savedReports[2]._id, // Streetlight approved
        type: 'approved',
        message: 'Great news! Your report #SF-2026-1003 (Broken Streetlights) was approved and scheduled for field repair.',
        isRead: false,
      },
      {
        userId: citizenB._id,
        reportId: savedReports[1]._id, // Garbage under review
        type: 'under_review',
        message: 'Your report #SF-2026-1002 (Overflowing Commercial Garbage Dumpster) is now under official review by municipal inspectors.',
        isRead: true,
      },
      {
        userId: citizenA._id,
        reportId: savedReports[6]._id, // Manhole cover resolved
        type: 'resolved',
        message: 'Your report #SF-2026-1007 (Dangerous Missing Manhole Cover) has been RESOLVED with proof photo.',
        isRead: false,
      },
      {
        userId: citizenC._id,
        reportId: savedReports[5]._id, // Park bench rejected
        type: 'rejected',
        message: 'Your report #SF-2026-1006 was reviewed and rejected. Note: Location is inside private property.',
        isRead: true,
      },
    ];

    for (const n of sampleNotifications) {
      const existing = await Notification.findOne({ userId: n.userId, reportId: n.reportId, type: n.type });
      if (!existing) {
        const notifDoc = await Notification.create(n);
        console.log(`  [+] Created Notification: [${notifDoc.type}] for user ${notifDoc.userId} (ID: ${notifDoc._id})`);
      } else {
        console.log(`  [=] Notification already present for report ${n.reportId}`);
      }
    }

    // 4. Summarize Counts
    console.log('\n======================================================');
    console.log('🎉 MONGO ATLAS VERIFICATION SUMMARY');
    console.log('======================================================');
    const userCount = await User.countDocuments();
    const reportCount = await Report.countDocuments();
    const notifCount = await Notification.countDocuments();

    console.log(`Database:            ${mongoose.connection.name}`);
    console.log(`Cluster Host:        ${mongoose.connection.host}`);
    console.log(`Total Users:         ${userCount}`);
    console.log(`Total Civic Reports: ${reportCount}`);
    console.log(`Total Notifications: ${notifCount}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    console.log('Atlas connection closed cleanly. Data is live in the cloud!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed MongoDB Atlas:', err);
    process.exit(1);
  }
};

seedAtlas();
