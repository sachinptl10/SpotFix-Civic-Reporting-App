const express = require('express');
const router = express.Router();

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SpotFix Civic Reporting & Operations API',
    version: '2.1.0',
    description:
      'Production-grade REST API powering the SpotFix Civic Reporting Mobile App and Municipal Official Triage Operations Console.',
    contact: {
      name: 'SpotFix Engineering Team',
      email: 'engineering@spotfix.gov',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Current Environment API Base',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT Bearer token obtained from /api/auth/login or /api/auth/register',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully.' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66d8f8a1234567890abcdef1' },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane.doe@example.com' },
          role: { type: 'string', enum: ['citizen', 'government'], example: 'citizen' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Report: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66d8f8a1234567890abcdef2' },
          reportNumber: { type: 'string', example: 'SP-10529' },
          title: { type: 'string', example: 'Deep Pothole on 5th Cross Road' },
          description: { type: 'string', example: 'Significant pothole causing hazards for two-wheelers.' },
          category: {
            type: 'string',
            enum: ['Pothole', 'Garbage', 'Broken Streetlight', 'Damaged Road', 'Water Leakage', 'Drainage Problem', 'Public Property Damage', 'Other'],
            example: 'Pothole',
          },
          status: {
            type: 'string',
            enum: ['pending', 'under_review', 'approved', 'rejected', 'resolved'],
            example: 'pending',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            example: 'high',
          },
          latitude: { type: 'number', example: 23.0225 },
          longitude: { type: 'number', example: 72.5714 },
          address: { type: 'string', example: '5th Cross Road, Navrangpura, Ahmedabad' },
          imageUrl: { type: 'string', example: '/uploads/spotfix-1788849640925-24787c84.png' },
          mediaType: { type: 'string', enum: ['image', 'video'], example: 'image' },
          resolvedImageUrl: { type: 'string', example: '/uploads/spotfix-resolved-1788849641030-935cda6c.png' },
          resolutionNote: { type: 'string', example: 'Filled with cold mix asphalt and compacted.' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ReportStats: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 45 },
          resolved: { type: 'integer', example: 18 },
          pending: { type: 'integer', example: 12 },
          inProgress: { type: 'integer', example: 20 },
          approved: { type: 'integer', example: 8 },
          rejected: { type: 'integer', example: 7 },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System Health'],
        summary: 'Server & Database Liveness Probe',
        responses: {
          200: { description: 'System online and healthy' },
          503: { description: 'Database disconnected' },
        },
      },
    },
    '/health/diagnostics': {
      get: {
        tags: ['System Health'],
        summary: 'Detailed Memory & Runtime Diagnostics',
        responses: {
          200: { description: 'System diagnostics information' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication & Identity'],
        summary: 'Register a new citizen account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Rohan Sharma' },
                  email: { type: 'string', example: 'rohan@example.com' },
                  password: { type: 'string', minLength: 6, example: 'SecurePass123!' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Citizen account registered successfully' },
          409: { description: 'Email address already in use' },
          422: { description: 'Validation error' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication & Identity'],
        summary: 'Authenticate citizen or municipal official',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'user@spotfix.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully with JWT' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['Authentication & Identity'],
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User profile object' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Authentication & Identity'],
        summary: 'Update current user profile (name, pushToken)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Rohan Sharma' },
                  pushToken: { type: 'string', example: 'ExponentPushToken[xxxxxxxxxxxxxx]' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/change-password': {
      put: {
        tags: ['Authentication & Identity'],
        summary: 'Update user password securely',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'password123' },
                  newPassword: { type: 'string', minLength: 6, example: 'NewSecretPass2026!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password changed successfully' },
          400: { description: 'Current password incorrect' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/push-token': {
      post: {
        tags: ['Authentication & Identity'],
        summary: 'Register mobile Expo push notification token',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pushToken'],
                properties: {
                  pushToken: { type: 'string', example: 'ExponentPushToken[xxxxxxxxxxxxxx]' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Push token registered' },
        },
      },
    },
    '/reports': {
      get: {
        tags: ['Civic Reports'],
        summary: 'List civic issue reports with filters & pagination',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
          { name: 'priority', in: 'query', schema: { type: 'string' }, description: 'Filter by priority' },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Full-text search query' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Paginated list of reports' },
        },
      },
      post: {
        tags: ['Civic Reports'],
        summary: 'Submit a new civic issue report (Supports Multipart & Base64 JSON)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'category', 'latitude', 'longitude'],
                properties: {
                  title: { type: 'string', example: 'Damaged storm drain on Main St' },
                  description: { type: 'string', example: 'The grate has fallen through creating a deep hazard.' },
                  category: { type: 'string', example: 'Drainage Problem' },
                  latitude: { type: 'number', example: 23.0225 },
                  longitude: { type: 'number', example: 72.5714 },
                  address: { type: 'string', example: 'Main Street, Ward 4' },
                  imageBase64: { type: 'string', description: 'Base64 data URI photograph' },
                  mediaType: { type: 'string', enum: ['image', 'video'], default: 'image' },
                },
              },
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'category', 'latitude', 'longitude'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  address: { type: 'string' },
                  image: { type: 'string', format: 'binary', description: 'Photograph or video evidence file' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Report created successfully' },
          422: { description: 'Validation error' },
        },
      },
    },
    '/reports/mine': {
      get: {
        tags: ['Civic Reports'],
        summary: 'Get reports submitted by authenticated citizen',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of citizen reports' },
        },
      },
    },
    '/reports/nearby': {
      get: {
        tags: ['Civic Reports'],
        summary: 'Discover issues near geographic coordinates (2dsphere)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'latitude', in: 'query', required: true, schema: { type: 'number', example: 23.0225 } },
          { name: 'longitude', in: 'query', required: true, schema: { type: 'number', example: 72.5714 } },
          { name: 'radius', in: 'query', schema: { type: 'integer', default: 5000, description: 'Radius in meters' } },
        ],
        responses: {
          200: { description: 'Reports located within radius' },
        },
      },
    },
    '/reports/stats': {
      get: {
        tags: ['Civic Reports'],
        summary: 'High-speed aggregated count metrics (Single-roundtrip facet pipeline)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Aggregated report counts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    stats: { $ref: '#/components/schemas/ReportStats' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/reports/batch-status': {
      post: {
        tags: ['Civic Reports'],
        summary: 'Batch update status for multiple reports (Government only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reportIds', 'targetStatus'],
                properties: {
                  reportIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['66d8f8a1234567890abcdef1', '66d8f8a1234567890abcdef2'],
                  },
                  targetStatus: {
                    type: 'string',
                    enum: ['under_review', 'approved'],
                    example: 'under_review',
                  },
                  note: { type: 'string', example: 'Bulk triage by ward supervisor.' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Batch update result summary' },
          403: { description: 'Government role required' },
        },
      },
    },
    '/reports/{id}': {
      get: {
        tags: ['Civic Reports'],
        summary: 'Get details of a single report',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Report detail' },
          404: { description: 'Report not found' },
        },
      },
    },
    '/reports/{id}/review': {
      patch: {
        tags: ['Government Workflow'],
        summary: 'Mark report Under Review (Government)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { note: { type: 'string', example: 'Under site evaluation by ward engineer.' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Status updated to under_review' } },
      },
    },
    '/reports/{id}/approve': {
      patch: {
        tags: ['Government Workflow'],
        summary: 'Approve report for civic repair crew (Government)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { reviewNote: { type: 'string', example: 'Crew dispatched for repair.' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Status updated to approved' } },
      },
    },
    '/reports/{id}/reject': {
      patch: {
        tags: ['Government Workflow'],
        summary: 'Reject report with mandatory reason (Government)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reviewNote'],
                properties: { reviewNote: { type: 'string', minLength: 5, example: 'Duplicate of ticket #SP-10024' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Status updated to rejected' } },
      },
    },
    '/reports/{id}/priority': {
      patch: {
        tags: ['Government Workflow'],
        summary: 'Set issue priority SLA level (Government)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['priority'],
                properties: { priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Priority updated' } },
      },
    },
    '/reports/{id}/resolve': {
      patch: {
        tags: ['Government Workflow'],
        summary: 'Resolve report with proof photo & notes (Government)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['note'],
                properties: {
                  note: { type: 'string', example: 'Pavement restored with asphalt patch.' },
                  resolvedImageBase64: { type: 'string', description: 'Base64 proof photo' },
                },
              },
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['note', 'resolvedImage'],
                properties: {
                  note: { type: 'string' },
                  resolvedImage: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Report marked resolved with proof' } },
      },
    },
    '/reports/{id}/export-pdf': {
      get: {
        tags: ['Civic Reports'],
        summary: 'Export printable Field Repair Work Order PDF',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'PDF binary stream',
            content: { 'application/pdf': {} },
          },
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get citizen alert notifications',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Paginated list of notifications' } },
      },
    },
    '/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Get unread notification count badge',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Count of unread notifications' } },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Notification marked as read' } },
      },
    },
    '/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'All notifications marked as read' } },
      },
    },
    '/analytics/summary': {
      get: {
        tags: ['Operations Analytics'],
        summary: 'Executive dashboard KPI summary & distribution metrics',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Aggregated analytics data' } },
      },
    },
  },
};

// Raw OpenAPI JSON spec endpoint
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(openApiSpec);
});

// Interactive Swagger UI HTML page
router.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SpotFix API Docs & Interactive Playground</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css" />
  <style>
    body { margin: 0; padding: 0; background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .topbar { display: none !important; }
    .swagger-ui .info { margin: 30px 0 20px 0; }
    .swagger-ui .info .title { font-size: 28px; color: #1e293b; }
    .swagger-ui { background: #ffffff; padding: 24px; border-radius: 12px; max-width: 1200px; margin: 30px auto; box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
    .header-bar { max-width: 1200px; margin: 20px auto 0; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; }
    .header-bar h1 { color: #38bdf8; font-size: 22px; margin: 0; }
    .header-bar a { color: #94a3b8; text-decoration: none; font-size: 14px; }
    .header-bar a:hover { color: #ffffff; }
  </style>
</head>
<body>
  <div class="header-bar">
    <h1>🏛️ SpotFix Civic Management API Console</h1>
    <a href="/api/docs/json" target="_blank">View OpenAPI JSON Specification ↗</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = {
  router,
  openApiSpec,
};
