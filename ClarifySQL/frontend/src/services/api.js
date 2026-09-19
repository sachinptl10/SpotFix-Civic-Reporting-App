import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const queryAPI = {
  ask: (question, sessionId) => api.post('/query/ask', { question, session_id: sessionId }),
  clarify: (sessionId, answers) => api.post('/query/clarify', { session_id: sessionId, answers }),
  execute: (sessionId, sql) => api.post('/query/execute', { session_id: sessionId, sql }),
};

export const schemaAPI = {
  getTables: () => api.get('/schema/tables'),
  getRelationships: () => api.get('/schema/relationships'),
};

export const historyAPI = {
  getHistory: (limit = 50) => api.get(`/history?limit=${limit}`),
  getQuery: (id) => api.get(`/history/${id}`),
};
