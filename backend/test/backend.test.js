const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const BASE_HOST = '127.0.0.1';
const BASE_PORT = 5000;

function jsonRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    let payload = '';
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resData);
          } catch (e) {
            parsed = resData;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function multipartRequest(path, fields, file, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
    let head = '';
    for (const [k, v] of Object.entries(fields)) {
      head += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
    }
    head += `--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
    const tail = `\r\n--${boundary}--\r\n`;

    const payload = Buffer.concat([
      Buffer.from(head, 'utf8'),
      Buffer.from(file.content || 'JPEG_BINARY_DATA'),
      Buffer.from(tail, 'utf8'),
    ]);

    const req = http.request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': payload.length,
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resData);
          } catch (e) {
            parsed = resData;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Shared Test State
let citizenToken = null;
let govToken = null;
let testReportId = null;
const uniqueEmail = `citizen_${Date.now()}@test.org`;

test('SpotFix Backend Automated Suite', async (t) => {

  await t.test('1. System Diagnostics & Health Check', async () => {
    const res = await jsonRequest('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'online');
    assert.strictEqual(res.data.database.status, 'connected');
    assert.ok(typeof res.data.database.latencyMs === 'number');

    const diag = await jsonRequest('GET', '/api/health/diagnostics');
    assert.strictEqual(diag.status, 200);
    assert.ok(diag.data.memory.heapUsedMb > 0);
  });

  await t.test('2. Citizen Public Registration', async () => {
    const res = await jsonRequest('POST', '/api/auth/register', {
      name: 'Aditi Sharma',
      email: uniqueEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.user.role, 'citizen');
    assert.ok(res.data.token);
    citizenToken = res.data.token;
  });

  await t.test('3. Duplicate Email Registration Conflict (409)', async () => {
    const res = await jsonRequest('POST', '/api/auth/register', {
      name: 'Aditi Clone',
      email: uniqueEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
    });

    assert.strictEqual(res.status, 409);
  });

  await t.test('4. Government Officer Login (Role-based)', async () => {
    const res = await jsonRequest('POST', '/api/auth/login', {
      email: 'gov@spotfix.gov',
      password: 'GovSpotFix@2026',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.role, 'government');
    assert.ok(res.data.token);
    govToken = res.data.token;
  });

  await t.test('5. Role Authorization: Citizen Blocked From Official Review Action (403)', async () => {
    const res = await jsonRequest(
      'PATCH',
      '/api/reports/65f1a2b3c4d5e6f7a8b9c0d1/review',
      { note: 'Unauthorized review' },
      citizenToken
    );
    assert.strictEqual(res.status, 403);
  });

  await t.test('6. Role Authorization: Government Permitted To Access Queue (200)', async () => {
    const res = await jsonRequest('GET', '/api/reports', null, govToken);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.reports));
  });

  await t.test('7. Report Creation: Citizen Submits Issue with GeoJSON (201)', async () => {
    const res = await jsonRequest(
      'POST',
      '/api/reports',
      {
        title: 'Dangerous pothole near MG Road metro station',
        description: 'Deep pothole causing two-wheelers to swerve into oncoming traffic.',
        category: 'Pothole',
        latitude: 12.9750,
        longitude: 77.6050,
        address: 'MG Road, Bengaluru',
      },
      citizenToken
    );

    assert.strictEqual(res.status, 201);
    assert.ok(res.data.report._id);
    assert.ok(res.data.report.reportNumber.startsWith('SP-'));
    assert.strictEqual(res.data.report.status, 'pending');
    assert.strictEqual(res.data.report.location.type, 'Point');
    testReportId = res.data.report._id;
  });

  await t.test('8. State Machine Protection: Illegal Status Jump pending -> approved (409)', async () => {
    // A report must be marked under_review before it can be approved
    const res = await jsonRequest(
      'PATCH',
      `/api/reports/${testReportId}/approve`,
      { reviewNote: 'Trying to skip under_review' },
      govToken
    );

    assert.strictEqual(res.status, 409);
    assert.ok(res.data.message.includes('under_review'));
  });

  await t.test('9. State Machine Step 1: Mark Under Review (200)', async () => {
    const res = await jsonRequest(
      'PATCH',
      `/api/reports/${testReportId}/review`,
      { note: 'Municipal engineer assigned for on-site inspection.' },
      govToken
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.report.status, 'under_review');
    assert.ok(res.data.report.statusHistory.length >= 2);
  });

  await t.test('10. State Machine Step 2: Approve Report (200)', async () => {
    const res = await jsonRequest(
      'PATCH',
      `/api/reports/${testReportId}/approve`,
      { reviewNote: 'Asphalt cold patch work order dispatched.' },
      govToken
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.report.status, 'approved');
  });

  await t.test('11. State Machine Step 3: Resolve Report with Proof Photo & Note (200)', async () => {
    const res = await multipartRequest(
      `/api/reports/${testReportId}/resolve`,
      { note: 'Pothole completely leveled and paved with bitumen.' },
      { name: 'resolvedImage', filename: 'resolution_proof.jpg', content: 'BINARY_IMAGE_DATA' },
      govToken
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.report.status, 'resolved');
    assert.ok(res.data.report.resolvedImageUrl);
  });

  await t.test('12. State Machine Protection: Terminal State resolved -> under_review (409)', async () => {
    const res = await jsonRequest(
      'PATCH',
      `/api/reports/${testReportId}/review`,
      { note: 'Attempting to reopen resolved issue' },
      govToken
    );

    assert.strictEqual(res.status, 409);
    assert.ok(res.data.message.includes('complete and cannot be transitioned'));
  });

  await t.test('13. Rejection Workflow: Rejection Requires Mandatory Reason (422)', async () => {
    // Create second report for rejection test
    const rep = await jsonRequest(
      'POST',
      '/api/reports',
      {
        title: 'Private driveway garden waste',
        description: 'Resident trimmed trees inside compound.',
        category: 'Garbage',
        latitude: 12.9800,
        longitude: 77.6100,
        address: 'Indiranagar 100ft Road',
      },
      citizenToken
    );

    const r2Id = rep.data.report._id;

    // Move to under_review first
    await jsonRequest('PATCH', `/api/reports/${r2Id}/review`, { note: 'Reviewing jurisdiction' }, govToken);

    // Attempt rejection without reviewNote
    const emptyReject = await jsonRequest('PATCH', `/api/reports/${r2Id}/reject`, {}, govToken);
    assert.strictEqual(emptyReject.status, 422);

    // Provide valid rejection note
    const validReject = await jsonRequest(
      'PATCH',
      `/api/reports/${r2Id}/reject`,
      { reviewNote: 'Private residential property outside municipal jurisdiction.' },
      govToken
    );
    assert.strictEqual(validReject.status, 200);
    assert.strictEqual(validReject.data.report.status, 'rejected');
  });

  await t.test('14. Geospatial 2dsphere Proximity Query (200)', async () => {
    const res = await jsonRequest(
      'GET',
      '/api/reports/nearby?latitude=12.9750&longitude=77.6050&radius=5000',
      null,
      citizenToken
    );

    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.data.count === 'number');
    assert.ok(Array.isArray(res.data.reports));
    assert.ok(res.data.count >= 1);
  });

  await t.test('15. Citizen Notification Center: Review Alerts & Unread Count (200)', async () => {
    const unread = await jsonRequest('GET', '/api/notifications/unread-count', null, citizenToken);
    assert.strictEqual(unread.status, 200);
    assert.ok(typeof unread.data.count === 'number' && unread.data.count >= 1);

    const list = await jsonRequest('GET', '/api/notifications', null, citizenToken);
    assert.strictEqual(list.status, 200);
    assert.ok(list.data.notifications.length >= 1);
  });
});
