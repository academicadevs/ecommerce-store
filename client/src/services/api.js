import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
};

// Cart API
export const cartAPI = {
  get: () => api.get('/cart'),
  addItem: (productId, quantity = 1, selectedOptions = null) =>
    api.post('/cart', { productId, quantity, selectedOptions }),
  updateItem: (itemId, quantity, selectedOptions) =>
    api.put(`/cart/${itemId}`, { quantity, selectedOptions }),
  updateQuantity: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
};

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  // Notifications
  getUnreadCounts: () => api.get('/admin/notifications/unread-counts'),
  getRecentNotifications: () => api.get('/admin/notifications/recent'),
  markNotificationsRead: (orderId) => api.post(`/admin/notifications/mark-read/${orderId}`),
  // Products
  getProducts: () => api.get('/admin/products'),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  // Orders
  getOrders: (filter) => api.get('/admin/orders', { params: { filter } }),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}`, { status }),
  assignOrder: (id, adminId) => api.put(`/admin/orders/${id}/assign`, { adminId }),
  getOrderNotes: (id) => api.get(`/admin/orders/${id}/notes`),
  addOrderNote: (id, note) => api.post(`/admin/orders/${id}/notes`, { note }),
  deleteOrderNote: (noteId) => api.delete(`/admin/orders/notes/${noteId}`),
  updateOrderItems: (id, items) => api.put(`/admin/orders/${id}/items`, { items }),
  updateCcEmails: (id, additionalEmails) => api.put(`/admin/orders/${id}/cc-emails`, { additionalEmails }),
  getOrderCommunications: (id) => api.get(`/admin/orders/${id}/communications`),
  sendOrderEmail: (id, subject, body, attachments = [], includeOrderDetails = true) => {
    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('body', body);
    formData.append('includeOrderDetails', includeOrderDetails.toString());
    attachments.forEach(att => {
      formData.append('attachments', att.file);
    });
    return api.post(`/admin/orders/${id}/email`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // Admins
  getAdmins: () => api.get('/admin/admins'),
  // Users
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  updateUserPassword: (id, password) => api.put(`/admin/users/${id}/password`, { password }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  updateUserType: (id, userType) => api.put(`/admin/users/${id}/userType`, { userType }),
  getUserOrders: (userId) => api.get(`/admin/users/${userId}/orders`),
  // Proofs
  getOrderProofs: (orderId) => api.get(`/proofs/order/${orderId}`),
  uploadProof: (formData) => api.post('/proofs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProof: (proofId) => api.delete(`/proofs/${proofId}`),
  resolveAnnotation: (annotationId) => api.post(`/proofs/annotations/${annotationId}/resolve`),
};

// Public Proofs API (no auth required)
export const proofsAPI = {
  getByToken: (accessToken) => api.get(`/proofs/review/${accessToken}`),
  addAnnotation: (accessToken, data) => api.post(`/proofs/review/${accessToken}/annotate`, data),
  deleteAnnotation: (accessToken, annotationId) => api.delete(`/proofs/review/${accessToken}/annotations/${annotationId}`),
  signOff: (accessToken, data) => api.post(`/proofs/review/${accessToken}/signoff`, data),
};

export default api;
