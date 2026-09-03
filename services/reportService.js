import api, { apiRequest } from './api';

export const reportService = {
  /**
   * Submit a new civic issue report with photograph or video and geolocation
   */
  async createReport({ title, description, category, latitude, longitude, address, imageUri, mediaType = 'image' }) {
    const formData = new FormData();

    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    formData.append('address', address);

    if (imageUri) {
      const filename = imageUri.split('/').pop() || (mediaType === 'video' ? 'report.mp4' : 'report.jpg');
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : (mediaType === 'video' ? 'mp4' : 'jpg');

      let mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'mp4') mimeType = 'video/mp4';
      else if (ext === 'mov') mimeType = 'video/quicktime';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: mimeType,
      });
    }

    return await apiRequest('/reports', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Get reports for authenticated citizen
   */
  async getMyReports(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.q) query.append('q', params.q.trim());
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const endpoint = queryString ? `/reports/mine?${queryString}` : '/reports/mine';

    return await api.get(endpoint);
  },

  /**
   * Get reports with pagination, category filter, priority, status, and text query
   */
  async getReports(params = {}) {
    const query = new URLSearchParams();
    if (params.scope) query.append('scope', params.scope);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params.search || params.q) query.append('search', (params.search || params.q).trim());
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const endpoint = queryString ? `/reports?${queryString}` : '/reports';

    return await api.get(endpoint);
  },

  /**
   * Get details of a single report by ID
   */
  async getReportById(id) {
    return await api.get(`/reports/${id}`);
  },

  /**
   * Mark report as under review (Government)
   */
  async markUnderReview(id, note = '') {
    return await api.patch(`/reports/${id}/review`, { note });
  },

  /**
   * Approve report for municipal action (Government)
   */
  async approveReport(id, reviewNote = '') {
    return await api.patch(`/reports/${id}/approve`, { reviewNote });
  },

  /**
   * Reject report with mandatory reason (Government)
   */
  async rejectReport(id, reviewNote) {
    return await api.patch(`/reports/${id}/reject`, { reviewNote });
  },

  /**
   * Set report priority (Government)
   */
  async setPriority(id, priority) {
    return await api.patch(`/reports/${id}/priority`, { priority });
  },

  /**
   * Resolve report with resolution photo and note (Government)
   */
  async resolveReport(id, { note, imageUri }) {
    const formData = new FormData();
    formData.append('note', note);

    if (imageUri) {
      const filename = imageUri.split('/').pop() || 'resolution_proof.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';

      let mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'webp') mimeType = 'image/webp';

      formData.append('resolvedImage', {
        uri: imageUri,
        name: filename,
        type: mimeType,
      });
    }

    return await apiRequest(`/reports/${id}/resolve`, {
      method: 'PATCH',
      body: formData,
    });
  },

  /**
   * Update report fields and optionally replace photograph/video
   */
  async updateReport(id, updateData, newMediaUri = null) {
    if (newMediaUri) {
      const formData = new FormData();
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          formData.append(key, String(updateData[key]));
        }
      });

      const filename = newMediaUri.split('/').pop() || 'updated_report.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const isVideo = ext === 'mp4' || ext === 'mov';
      const mimeType = isVideo
        ? (ext === 'mov' ? 'video/quicktime' : 'video/mp4')
        : (ext === 'png' ? 'image/png' : 'image/jpeg');

      formData.append('image', {
        uri: newMediaUri,
        name: filename,
        type: mimeType,
      });

      return await apiRequest(`/reports/${id}`, {
        method: 'PUT',
        body: formData,
      });
    }

    return await api.put(`/reports/${id}`, updateData);
  },

  /**
   * Delete report by ID
   */
  async deleteReport(id) {
    return await api.delete(`/reports/${id}`);
  },

  /**
   * Get report counts and statistics
   */
  async getReportStats() {
    return await api.get('/reports/stats');
  },
};

export default reportService;
