import api from './api';

export const submitFeedback = async (data) => {
  const res = await api.post('/feedback', data);
  return res.data;
};

export const getFeedback = async (params = {}) => {
  const res = await api.get('/feedback', { params });
  return res.data;
};

export const getAnalytics = async () => {
  const res = await api.get('/feedback/analytics');
  return res.data;
};

export const checkFeedbackSubmitted = async (courseId) => {
  const res = await api.get(`/feedback/check/${courseId}`);
  return res.data;
};

export const deleteFeedback = async (id) => {
  const res = await api.delete(`/feedback/${id}`);
  return res.data;
};
