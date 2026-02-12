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
  createGuest: (data) => api.post('/orders/guest', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  uploadAttachments: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post('/orders/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
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
  // Product Images
  uploadProductImage: (productId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/admin/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  reorderProductImages: (productId, images) =>
    api.put(`/admin/products/${productId}/images/reorder`, { images }),
  deleteProductImage: (productId, imageIndex) =>
    api.delete(`/admin/products/${productId}/images/${imageIndex}`),
  reorderProducts: (productIds) => api.put('/admin/products/reorder', { productIds }),
  // Orders
  getOrders: (filter) => api.get('/admin/orders', { params: { filter } }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateShippingInfo: (id, shippingInfo, userId) => {
    const body = { shippingInfo };
    if (userId !== undefined) body.userId = userId;
    return api.put(`/admin/orders/${id}/shipping-info`, body);
  },
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
  createQuickUser: (data) => api.post('/admin/users/quick', data),
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
  // Schools
  getSchools: () => api.get('/admin/schools'),
  getSchool: (id) => api.get(`/admin/schools/${id}`),
  createSchool: (data) => api.post('/admin/schools', data),
  updateSchool: (id, data) => api.put(`/admin/schools/${id}`, data),
  toggleSchoolActive: (id) => api.put(`/admin/schools/${id}/toggle-active`),
  deleteSchool: (id) => api.delete(`/admin/schools/${id}`),
  getSchoolUsers: (id) => api.get(`/admin/schools/${id}/users`),
  // Offices
  getOffices: () => api.get('/admin/offices'),
  getOffice: (id) => api.get(`/admin/offices/${id}`),
  createOffice: (data) => api.post('/admin/offices', data),
  updateOffice: (id, data) => api.put(`/admin/offices/${id}`, data),
  toggleOfficeActive: (id) => api.put(`/admin/offices/${id}/toggle-active`),
  deleteOffice: (id) => api.delete(`/admin/offices/${id}`),
  getOfficeUsers: (id) => api.get(`/admin/offices/${id}/users`),
  // Audit Log
  getAuditLog: (params) => api.get('/admin/audit-log', { params }),
  getAuditLogRecent: (limit) => api.get('/admin/audit-log/recent', { params: { limit } }),
  getAuditLogFilters: () => api.get('/admin/audit-log/filters'),
};

// Schools API (public endpoint for active schools)
export const schoolsAPI = {
  getActive: () => api.get('/schools'),
  getById: (id) => api.get(`/schools/${id}`),
};

// Offices API (public endpoint for active offices)
export const officesAPI = {
  getActive: () => api.get('/offices'),
  getById: (id) => api.get(`/offices/${id}`),
};

// Public Proofs API (no auth required)
export const proofsAPI = {
  getByToken: (accessToken) => api.get(`/proofs/review/${accessToken}`),
  addAnnotation: (accessToken, data) => api.post(`/proofs/review/${accessToken}/annotate`, data),
  deleteAnnotation: (accessToken, annotationId) => api.delete(`/proofs/review/${accessToken}/annotations/${annotationId}`),
  signOff: (accessToken, data) => api.post(`/proofs/review/${accessToken}/signoff`, data),
};

// Reports API
export const reportsAPI = {
  // Dashboard
  getDashboard: (dateRange) => api.get('/admin/reports/dashboard', { params: dateRange }),
  // Orders
  getOrderVolume: (dateRange, groupBy) => api.get('/admin/reports/orders/volume', { params: { ...dateRange, groupBy } }),
  getOrderStatusDistribution: (dateRange) => api.get('/admin/reports/orders/status-distribution', { params: dateRange }),
  getOrdersByAdmin: (dateRange) => api.get('/admin/reports/orders/by-admin', { params: dateRange }),
  getOrdersHeatmap: (dateRange) => api.get('/admin/reports/orders/heatmap', { params: dateRange }),
  // Products
  getTopProducts: (dateRange, limit) => api.get('/admin/reports/products/top-selling', { params: { ...dateRange, limit } }),
  getProductsByCategory: (dateRange) => api.get('/admin/reports/products/by-category', { params: dateRange }),
  // Users
  getUsersOverview: (dateRange) => api.get('/admin/reports/users/overview', { params: dateRange }),
  getTopSchools: (dateRange, limit) => api.get('/admin/reports/schools/top', { params: { ...dateRange, limit } }),
  // Communications
  getCommunicationsOverview: (dateRange) => api.get('/admin/reports/communications/overview', { params: dateRange }),
  // Staff
  getStaffPerformance: (dateRange) => api.get('/admin/reports/staff/performance', { params: dateRange }),
  // Export
  exportData: (type, data) => api.post(`/admin/reports/export/${type}`, data, { responseType: 'blob' }),
};

export default api;
