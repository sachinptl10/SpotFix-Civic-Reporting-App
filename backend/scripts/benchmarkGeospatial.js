const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Report = require('../models/Report');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spotfix';
const TOTAL_BENCHMARK_REPORTS = 500;
const BENCHMARK_QUERIES = 200;
const CONCURRENCY = 10;

const CATEGORIES = [
  'Pothole',
  'Garbage',
  'Broken Streetlight',
  'Damaged Road',
  'Water Leakage',
  'Drainage Problem',
  'Public Property Damage',
  'Other',
];

const STATUSES = ['pending', 'under_review', 'approved', 'resolved', 'rejected'];
const PRIORITIES = ['low', 'medium', 'high'];

// Bengaluru Metro Center (12.9716, 77.5946)
const CENTER_LAT = 12.9716;
const CENTER_LNG = 77.5946;

function getRandomCoordinate(centerLat, centerLng, radiusKm = 10) {
  const y0 = centerLat;
  const x0 = centerLng;
  const rd = radiusKm / 111.3; // roughly degrees per km

  const u = Math.random();
  const v = Math.random();

  const w = rd * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  const xp = x / Math.cos(y0 * (Math.PI / 180));

  return {
    latitude: y + y0,
    longitude: xp + x0,
  };
}

function apiQuery(lat, lng, radius, token) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/reports/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => {
          const latency = performance.now() - start;
          try {
            const json = JSON.parse(data);
            resolve({ statusCode: res.statusCode, latency, count: json.count || 0 });
          } catch (e) {
            resolve({ statusCode: res.statusCode, latency, count: 0 });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  console.log('====================================================');
  console.log('  SPOTFIX V2 GEOSPATIAL 2DSPHERE BENCHMARK SUITE    ');
  console.log('====================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  // Find or create citizen test user
  let user = await User.findOne({ role: 'citizen' });
  if (!user) {
    user = await User.create({
      name: 'Benchmark Citizen',
      email: 'bench_' + Date.now() + '@spotfix.org',
      password: 'BenchmarkSecret123!',
      role: 'citizen',
    });
  }

  // Check current count
  const existingCount = await Report.countDocuments();
  console.log(`Current report count in database: ${existingCount}`);

  if (existingCount < TOTAL_BENCHMARK_REPORTS) {
    const toCreate = TOTAL_BENCHMARK_REPORTS - existingCount;
    console.log(`Seeding ${toCreate} realistic reports across metropolitan area...`);

    const docs = [];
    for (let i = 0; i < toCreate; i++) {
      const coords = getRandomCoordinate(CENTER_LAT, CENTER_LNG, 15);
      const cat = CATEGORIES[i % CATEGORIES.length];
      const status = STATUSES[i % STATUSES.length];
      const priority = PRIORITIES[i % PRIORITIES.length];

      docs.push({
        reportNumber: `SP-${20000 + i}`,
        title: `${cat} reported near Sector ${Math.floor(Math.random() * 50) + 1}`,
        description: `Field inspection needed for ${cat.toLowerCase()} causing civic disruption.`,
        category: cat,
        status: status,
        priority: priority,
        user: user._id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        location: {
          type: 'Point',
          coordinates: [coords.longitude, coords.latitude],
        },
        address: `Sector ${Math.floor(Math.random() * 50) + 1}, Metropolitan Area`,
        statusHistory: [{ status: 'pending', note: 'Created', changedBy: user._id, timestamp: new Date() }],
      });
    }

    await Report.insertMany(docs);
    console.log(`Successfully seeded database. Total reports now: ${await Report.countDocuments()}`);
  }

  // Get a JWT token for the benchmark queries
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '1d',
  });

  console.log('\nWarming up index and executing benchmark queries...');
  console.log(`Simulating ${BENCHMARK_QUERIES} geospatial queries (concurrency: ${CONCURRENCY})...\n`);

  const latencies = [];
  const startTotal = performance.now();

  // Run in concurrent batches
  for (let i = 0; i < BENCHMARK_QUERIES; i += CONCURRENCY) {
    const batch = [];
    for (let j = 0; j < CONCURRENCY && i + j < BENCHMARK_QUERIES; j++) {
      const qCoord = getRandomCoordinate(CENTER_LAT, CENTER_LNG, 8);
      const radiusMeters = 3000 + Math.floor(Math.random() * 5000); // 3km - 8km
      batch.push(apiQuery(qCoord.latitude, qCoord.longitude, radiusMeters, token));
    }
    const results = await Promise.all(batch);
    for (const r of results) {
      latencies.push(r.latency);
    }
  }

  const totalTimeSec = (performance.now() - startTotal) / 1000;
  latencies.sort((a, b) => a - b);

  const total = latencies.length;
  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const avg = (sum / total).toFixed(2);
  const min = latencies[0].toFixed(2);
  const max = latencies[total - 1].toFixed(2);
  const p50 = latencies[Math.floor(total * 0.5)].toFixed(2);
  const p90 = latencies[Math.floor(total * 0.9)].toFixed(2);
  const p95 = latencies[Math.floor(total * 0.95)].toFixed(2);
  const p99 = latencies[Math.floor(total * 0.99)].toFixed(2);
  const rps = (total / totalTimeSec).toFixed(1);

  console.log('====================================================');
  console.log('              BENCHMARK RESULTS REPORT             ');
  console.log('====================================================');
  console.log(`Total Database Records  : ${await Report.countDocuments()}`);
  console.log(`Total Queries Executed  : ${total}`);
  console.log(`Total Elapsed Time      : ${totalTimeSec.toFixed(2)}s`);
  console.log(`Throughput              : ${rps} req/sec`);
  console.log(`Min Latency             : ${min} ms`);
  console.log(`Average Latency         : ${avg} ms`);
  console.log(`Median (p50) Latency    : ${p50} ms`);
  console.log(`p90 Latency             : ${p90} ms`);
  console.log(`p95 Latency             : ${p95} ms`);
  console.log(`p99 Latency             : ${p99} ms`);
  console.log(`Max Latency             : ${max} ms`);
  console.log('====================================================\n');

  console.log('RESUME BULLET POINT (READY TO COPY & PASTE):');
  console.log(`"Benchmarked MongoDB 2dsphere geospatial queries over ${await Report.countDocuments()} seeded records, achieving a p95 response latency of ${p95}ms and average latency of ${avg}ms at ${rps} req/sec under concurrent load."\n`);

  await mongoose.disconnect();
  process.exit(0);
})();
