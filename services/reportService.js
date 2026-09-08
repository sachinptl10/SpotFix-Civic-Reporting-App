import { Platform, Linking } from 'react-native';
import api, { apiRequest, getStoredToken, getActiveServerHost } from './api';
import { API_BASE_URL } from '../utils/constants';

/**
 * Safely convert a local file URI to a Base64 data URI using Fetch and FileReader
 */
const convertUriToBase64 = async (uri) => {
  if (!uri) return null;
  if (typeof uri === 'string' && uri.startsWith('data:')) return uri;

  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[reportService] convertUriToBase64 failed:', err?.message || err);
    return null;
  }
};

export const reportService = {
  /**
   * Submit a new civic issue report with photograph or video and geolocation
   */
  async createReport({ title, description, category, latitude, longitude, address, imageUri, imageBase64, mediaType = 'image' }) {
    // 1. Direct JSON submission when no media is attached
    if (!imageUri && !imageBase64) {
      return await api.post('/reports', {
        title,
        description,
        category,
        latitude: Number(latitude),
        longitude: Number(longitude),
        address,
        mediaType: 'image',
      });
    }

    // 2. If Base64 data is already provided directly, send direct JSON
    if (imageBase64) {
      return await api.post('/reports', {
        title,
        description,
        category,
        latitude: Number(latitude),
        longitude: Number(longitude),
        address,
        imageBase64,
        mediaType,
      });
    }

    // 3. Image URI provided: Construct FormData with Blob support
    const filename = imageUri.split('/').pop() || (mediaType === 'video' ? 'report.mp4' : 'report.jpg');
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : (mediaType === 'video' ? 'mp4' : 'jpg');

    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'mp4') mimeType = 'video/mp4';
    else if (ext === 'mov') mimeType = 'video/quicktime';

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('address', address);
      formData.append('mediaType', mediaType);

      let attached = false;
      try {
        const fileRes = await fetch(imageUri);
        const blob = await fileRes.blob();
        if (blob && (blob.size > 0 || blob._data)) {
          formData.append('image', blob, filename);
          attached = true;
        }
      } catch (blobErr) {
        // Blob fetch not available for this URI
      }

      if (!attached) {
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
    } catch (uploadErr) {
      console.warn('[reportService] Multipart upload encountered error, attempting Base64 JSON fallback:', uploadErr.message);

      // 4. Automated fallback to Base64 JSON payload
      const base64Data = await convertUriToBase64(imageUri);
      if (base64Data) {
        return await api.post('/reports', {
          title,
          description,
          category,
          latitude: Number(latitude),
          longitude: Number(longitude),
          address,
          imageBase64: base64Data,
          mediaType,
        });
      }

      throw uploadErr;
    }
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
    if (!imageUri) {
      return await api.patch(`/reports/${id}/resolve`, { note });
    }

    const filename = imageUri.split('/').pop() || 'resolution_proof.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    let mimeType = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');

    try {
      const formData = new FormData();
      formData.append('note', note);

      let attached = false;
      try {
        const fileRes = await fetch(imageUri);
        const blob = await fileRes.blob();
        if (blob && (blob.size > 0 || blob._data)) {
          formData.append('resolvedImage', blob, filename);
          attached = true;
        }
      } catch (blobErr) {}

      if (!attached) {
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
    } catch (err) {
      console.warn('[reportService] Multipart resolveReport failed, using Base64 fallback:', err.message);
      const base64Data = await convertUriToBase64(imageUri);
      if (base64Data) {
        return await api.patch(`/reports/${id}/resolve`, {
          note,
          resolvedImageBase64: base64Data,
        });
      }
      throw err;
    }
  },

  /**
   * Update report fields and optionally replace photograph/video
   */
  async updateReport(id, updateData, newMediaUri = null) {
    if (!newMediaUri) {
      return await api.put(`/reports/${id}`, updateData);
    }

    const filename = newMediaUri.split('/').pop() || 'updated_report.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    const isVideo = ext === 'mp4' || ext === 'mov';
    const mimeType = isVideo
      ? (ext === 'mov' ? 'video/quicktime' : 'video/mp4')
      : (ext === 'png' ? 'image/png' : 'image/jpeg');

    try {
      const formData = new FormData();
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          formData.append(key, String(updateData[key]));
        }
      });

      let attached = false;
      try {
        const fileRes = await fetch(newMediaUri);
        const blob = await fileRes.blob();
        if (blob && (blob.size > 0 || blob._data)) {
          formData.append('image', blob, filename);
          attached = true;
        }
      } catch (blobErr) {}

      if (!attached) {
        formData.append('image', {
          uri: newMediaUri,
          name: filename,
          type: mimeType,
        });
      }

      return await apiRequest(`/reports/${id}`, {
        method: 'PUT',
        body: formData,
      });
    } catch (err) {
      console.warn('[reportService] Multipart updateReport failed, using Base64 fallback:', err.message);
      const base64Data = await convertUriToBase64(newMediaUri);
      if (base64Data) {
        return await api.put(`/reports/${id}`, {
          ...updateData,
          imageBase64: base64Data,
          mediaType: isVideo ? 'video' : 'image',
        });
      }
      throw err;
    }
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

  /**
   * Export Field Repair Work Order PDF
   */
  async exportWorkOrderPdf(id, reportNumber = 'report') {
    const token = await getStoredToken();
    const host = await getActiveServerHost();
    const url = `${host}/api/reports/${id}/export-pdf`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to generate PDF work order');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `work-order-${reportNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      return true;
    } else {
      const mobileUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
      await Linking.openURL(mobileUrl);
      return true;
    }
  },
};

export default reportService;
