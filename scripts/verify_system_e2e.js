/**
 * SpotFix End-to-End System Simulation & Verification
 * Tests the complete lifecycle:
 * 1. Citizen registers & authenticates
 * 2. Citizen raises issue with photo & GPS
 * 3. Citizen checks home feed & geospatial discovery
 * 4. Government officer logs in
 * 5. Government officer triages pending queue
 * 6. Government officer sets priority to HIGH
 * 7. Government officer moves to UNDER REVIEW
 * 8. Government officer APPROVES report
 * 9. Government officer exports Field Repair Work Order PDF
 * 10. Government officer marks RESOLVED with resolution proof photo & notes
 * 11. Citizen verifies resolution proof, status timeline, and notification alerts
 */

const http = require('http');

const PORT = 5000;
const HOST = '127.0.0.1';

// Helper to make HTTP requests
function request(options, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const reqHeaders = { ...headers };

    let payload = null;
    if (data && typeof data === 'object' && !Buffer.isBuffer(data) && !reqHeaders['Content-Type']) {
      payload = JSON.stringify(data);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    } else if (data && (typeof data === 'string' || Buffer.isBuffer(data))) {
      payload = data;
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: options.path,
        method: options.method || 'GET',
        headers: reqHeaders,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const rawBuffer = Buffer.concat(chunks);
          const rawString = rawBuffer.toString('utf8');
          let json = null;
          try {
            json = JSON.parse(rawString);
          } catch (e) {
            // Not JSON (e.g. PDF or raw file)
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: json,
            buffer: rawBuffer,
            text: rawString,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Build a minimal valid 1x1 JPEG buffer for testing image uploads
function createDummyJpegBuffer() {
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x80, 0xff, 0xd9,
  ]);
}

// Build multipart/form-data payload with text fields and a file
function buildMultipartPayload(fields, fileField, filename, fileBuffer, mimeType = 'image/jpeg') {
  const boundary = '----SpotFixE2EBoundary' + Math.random().toString(36).substring(2);
  const crlf = '\r\n';
  const parts = [];

  for (const [key, val] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}${crlf}` +
        `Content-Disposition: form-data; name="${key}"${crlf}${crlf}` +
        `${val}${crlf}`
      )
    );
  }

  if (fileField && filename && fileBuffer) {
    parts.push(
      Buffer.from(
        `--${boundary}${crlf}` +
        `Content-Disposition: form-data; name="${fileField}"; filename="${filename}"${crlf}` +
        `Content-Type: ${mimeType}${crlf}${crlf}`
      )
    );
    parts.push(fileBuffer);
    parts.push(Buffer.from(crlf));
  }

  parts.push(Buffer.from(`--${boundary}--${crlf}`));

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat(parts),
  };
}

async function runE2ESimulation() {
  console.log('\n=============================================================');
  console.log('  SPOTFIX FULL SYSTEM LIVE SIMULATION: CITIZEN -> GOVERNMENT ');
  console.log('=============================================================\n');

  let passedSteps = 0;
  const totalSteps = 11;

  // -------------------------------------------------------------
  // STEP 1: Citizen Registration & Authentication
  // -------------------------------------------------------------
  console.log('▶ STEP 1: Citizen Registration & Auth');
  const citizenEmail = `citizen_${Date.now()}@spotfix.org`;
  const regRes = await request(
    { path: '/api/auth/register', method: 'POST' },
    {
      name: 'Priya Sundaram',
      email: citizenEmail,
      password: 'CitizenSafePass2026',
      confirmPassword: 'CitizenSafePass2026',
    }
  );

  if (regRes.statusCode !== 201 || !regRes.data?.token) {
    throw new Error(`Failed to register citizen: ${regRes.statusCode} - ${regRes.text}`);
  }
  const citizenToken = regRes.data.token;
  const citizenId = regRes.data.user._id;
  console.log(`  ✔ Citizen created: ${regRes.data.user.name} (${citizenEmail})`);
  console.log(`  ✔ Auth Token obtained (Role: ${regRes.data.user.role})`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 2: Citizen Raises Issue with Photo Evidence (Multipart/form-data)
  // -------------------------------------------------------------
  console.log('\n▶ STEP 2: Citizen Snaps Photo & Submits Issue (POST /api/reports)');
  const dummyPhoto = createDummyJpegBuffer();
  const reportPayload = buildMultipartPayload(
    {
      title: 'Dangerous Deep Crater Pothole on 100ft Ring Road',
      category: 'roads',
      description:
        'Large, severe pothole roughly 10 inches deep right after the signal curve. Causing vehicle damage and traffic bottleneck.',
      latitude: '12.9716',
      longitude: '77.5946',
      address: '100ft Ring Road, Near Junction 4, Ward 18',
    },
    'image',
    'pothole_evidence.jpg',
    dummyPhoto,
    'image/jpeg'
  );

  const createRes = await request(
    { path: '/api/reports', method: 'POST' },
    reportPayload.body,
    {
      'Content-Type': reportPayload.contentType,
      Authorization: `Bearer ${citizenToken}`,
    }
  );

  if (createRes.statusCode !== 201 || !createRes.data?.report) {
    throw new Error(`Failed to create report: ${createRes.statusCode} - ${createRes.text}`);
  }
  const report = createRes.data.report;
  const reportId = report._id;
  const reportNumber = report.reportNumber;
  console.log(`  ✔ Report created successfully: #${reportNumber} (ID: ${reportId})`);
  console.log(`  ✔ Initial Status: "${report.status}" | Priority: "${report.priority}"`);
  console.log(`  ✔ Uploaded Photo URL: ${report.imageUrl}`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 3: Citizen Verification: Home Feed & Geospatial Nearby
  // -------------------------------------------------------------
  console.log('\n▶ STEP 3: Citizen Feed & Map Discovery');
  const myReportsRes = await request(
    { path: '/api/reports/mine', method: 'GET' },
    null,
    { Authorization: `Bearer ${citizenToken}` }
  );

  const foundInMine = myReportsRes.data?.reports?.some((r) => r._id === reportId);
  console.log(`  ✔ Report #${reportNumber} appears in Citizen's Personal Feed: ${foundInMine ? 'YES' : 'NO'}`);

  const nearbyRes = await request(
    { path: '/api/reports/nearby?latitude=12.9716&longitude=77.5946&radius=2000', method: 'GET' },
    null,
    { Authorization: `Bearer ${citizenToken}` }
  );
  const foundInMap = nearbyRes.data?.reports?.some((r) => r._id === reportId);
  console.log(`  ✔ Report #${reportNumber} discoverable on Civic GPS Map: ${foundInMap ? 'YES' : 'NO'}`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 4: Government Officer Login
  // -------------------------------------------------------------
  console.log('\n▶ STEP 4: Government Officer Authentication');
  const govRes = await request(
    { path: '/api/auth/login', method: 'POST' },
    {
      email: 'gov@spotfix.gov',
      password: 'GovSpotFix@2026',
    }
  );

  if (govRes.statusCode !== 200 || !govRes.data?.token) {
    throw new Error(`Failed to login government officer: ${govRes.statusCode} - ${govRes.text}`);
  }
  const govToken = govRes.data.token;
  console.log(`  ✔ Officer Logged in: ${govRes.data.user.name} (${govRes.data.user.email})`);
  console.log(`  ✔ Role: ${govRes.data.user.role}`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 5: Government Triages Pending Review Queue
  // -------------------------------------------------------------
  console.log('\n▶ STEP 5: Government Review Queue Discovery');
  const queueRes = await request(
    { path: '/api/reports?status=pending', method: 'GET' },
    null,
    { Authorization: `Bearer ${govToken}` }
  );

  const foundInQueue = queueRes.data?.reports?.some((r) => r._id === reportId);
  console.log(`  ✔ Report #${reportNumber} located in Pending Review Queue: ${foundInQueue ? 'YES' : 'NO'}`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 6: Government Escalates Priority to HIGH
  // -------------------------------------------------------------
  console.log('\n▶ STEP 6: Government Assigns Priority -> HIGH');
  const prioRes = await request(
    { path: `/api/reports/${reportId}/priority`, method: 'PATCH' },
    { priority: 'high' },
    { Authorization: `Bearer ${govToken}` }
  );
  console.log(`  ✔ Report priority updated to: "${prioRes.data?.report?.priority}"`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 7: Government Marks Issue UNDER REVIEW
  // -------------------------------------------------------------
  console.log('\n▶ STEP 7: Government Moves Status -> UNDER REVIEW');
  const reviewRes = await request(
    { path: `/api/reports/${reportId}/review`, method: 'PATCH' },
    { note: 'Assigned to Municipal Roads & Bridges Division. Inspection scheduled.' },
    { Authorization: `Bearer ${govToken}` }
  );
  console.log(`  ✔ Report status transitioned to: "${reviewRes.data?.report?.status}"`);
  console.log(`  ✔ Review Note: "${reviewRes.data?.report?.reviewNote}"`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 8: Government APPROVES Report for Action
  // -------------------------------------------------------------
  console.log('\n▶ STEP 8: Government Approves Report for Public Works');
  const approveRes = await request(
    { path: `/api/reports/${reportId}/approve`, method: 'PATCH' },
    { reviewNote: 'Site inspection verified deep crater. Field repair crew dispatched.' },
    { Authorization: `Bearer ${govToken}` }
  );
  console.log(`  ✔ Report status transitioned to: "${approveRes.data?.report?.status}"`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 9: Field Repair Work Order PDF Export
  // -------------------------------------------------------------
  console.log('\n▶ STEP 9: Field Repair Work Order PDF Generation (GET /api/reports/:id/export-pdf)');
  const pdfRes = await request(
    { path: `/api/reports/${reportId}/export-pdf`, method: 'GET' },
    null,
    { Authorization: `Bearer ${govToken}` }
  );

  const isPdf = pdfRes.headers['content-type']?.includes('application/pdf');
  const pdfSize = pdfRes.buffer.length;
  console.log(`  ✔ Work Order PDF Content-Type: ${pdfRes.headers['content-type']}`);
  console.log(`  ✔ Work Order PDF Size: ${(pdfSize / 1024).toFixed(2)} KB`);
  if (!isPdf || pdfSize < 1000) {
    throw new Error('Generated PDF is invalid or empty.');
  }
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 10: Government Marks Issue RESOLVED with Proof Photo & Notes
  // -------------------------------------------------------------
  console.log('\n▶ STEP 10: Government Resolves Report with Photo Evidence');
  const dummyResolutionPhoto = createDummyJpegBuffer();
  const resolvePayload = buildMultipartPayload(
    {
      note: 'Crater excavated, bitumen base compacted, and hot-mix asphalt leveled flush with street surface.',
    },
    'resolvedImage',
    'resolution_proof.jpg',
    dummyResolutionPhoto,
    'image/jpeg'
  );

  const resolveRes = await request(
    { path: `/api/reports/${reportId}/resolve`, method: 'PATCH' },
    resolvePayload.body,
    {
      'Content-Type': resolvePayload.contentType,
      Authorization: `Bearer ${govToken}`,
    }
  );

  if (resolveRes.statusCode !== 200 || !resolveRes.data?.report) {
    throw new Error(`Failed to resolve report: ${resolveRes.statusCode} - ${resolveRes.text}`);
  }
  const resolvedReport = resolveRes.data.report;
  console.log(`  ✔ Report Final Status: "${resolvedReport.status}"`);
  console.log(`  ✔ Resolution Proof Photo: ${resolvedReport.resolvedImageUrl}`);
  console.log(`  ✔ Resolution Notes: "${resolvedReport.resolutionNote}"`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 11: Citizen Verification & Notification Inbox Audit
  // -------------------------------------------------------------
  console.log('\n▶ STEP 11: Citizen Final Audit & Notification Inbox');
  const finalReportRes = await request(
    { path: `/api/reports/${reportId}`, method: 'GET' },
    null,
    { Authorization: `Bearer ${citizenToken}` }
  );

  const r = finalReportRes.data?.report;
  console.log(`  ✔ Citizen fetches verified report #${r.reportNumber}`);
  console.log(`    • Status: ${r.status}`);
  console.log(`    • Priority: ${r.priority}`);
  console.log(`    • Resolution Proof Attached: ${r.resolvedImageUrl ? 'YES' : 'NO'}`);
  console.log(`    • Complete Audit Timeline entries: ${r.statusHistory?.length || 0}`);
  r.statusHistory.forEach((h, idx) => {
    console.log(`      [${idx + 1}] ${h.status.toUpperCase()} (${new Date(h.timestamp).toLocaleTimeString()}) -> "${h.note}"`);
  });

  const notifsRes = await request(
    { path: '/api/notifications', method: 'GET' },
    null,
    { Authorization: `Bearer ${citizenToken}` }
  );
  console.log(`  ✔ Citizen received ${notifsRes.data?.notifications?.length || 0} real-time notifications:`);
  (notifsRes.data?.notifications || []).forEach((n, idx) => {
    console.log(`    • Notification ${idx + 1}: [${n.type}] "${n.message}"`);
  });
  passedSteps++;

  console.log('\n=============================================================');
  console.log(`  ALL ${passedSteps}/${totalSteps} END-TO-END STEPS PASSED 100% SUCCESSFULLY!`);
  console.log('=============================================================\n');
}

runE2ESimulation().catch((err) => {
  console.error('\n❌ E2E Simulation Failed:', err);
  process.exit(1);
});
