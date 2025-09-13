import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('http://localhost:8000/api/token/refresh/', {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login/', credentials),
  
  register: (userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role: string;
    phone_number?: string;
  }) => api.post('/auth/register/', userData),
  
  logout: () => api.post('/auth/logout/', {
    refresh: localStorage.getItem('refresh_token'),
  }),
  
  getProfile: () => api.get('/auth/profile/'),
  
  changePassword: (passwords: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => api.post('/auth/change-password/', passwords),
  
  getUserRoles: () => api.get('/auth/roles/'),
  
  getUserDashboard: () => api.get('/auth/dashboard/'),
};

// Core API
export const coreAPI = {
  getDashboardMetrics: () => api.get('/core/dashboard/metrics/'),
  
  getDepartments: () => api.get('/core/departments/'),
  getDepartment: (id: number) => api.get(`/core/departments/${id}/`),
  getDepartmentProjects: (id: number) => api.get(`/core/departments/${id}/projects/`),
  
  getProjects: () => api.get('/core/projects/'),
  getProject: (id: number) => api.get(`/core/projects/${id}/`),
  createProject: (data: any) => api.post('/core/projects/', data),
  updateProject: (id: number, data: any) => api.patch(`/core/projects/${id}/`, data),
  
  getImpactMetrics: () => api.get('/core/impact-metrics/'),
  getProjectImpactMetrics: (id: number) => api.get(`/core/projects/${id}/impact-metrics/`),
  verifyImpactMetric: (id: number) => api.post(`/core/impact-metrics/${id}/verify/`),
  
  getProjectStatusSummary: () => api.get('/core/project-status-summary/'),
  getDepartmentPerformance: () => api.get('/core/department-performance/'),
};

// Fund Flows API
export const fundFlowsAPI = {
  getFundFlowDiagram: () => api.get('/fund-flows/diagram/'),
  
  getFundSources: () => api.get('/fund-flows/sources/'),
  getFundSource: (id: number) => api.get(`/fund-flows/sources/${id}/`),
  
  getFundFlows: () => api.get('/fund-flows/flows/'),
  getFundFlow: (id: number) => api.get(`/fund-flows/flows/${id}/`),
  createFundFlow: (data: any) => api.post('/fund-flows/flows/', data),
  verifyFundFlow: (id: number) => api.post(`/fund-flows/flows/${id}/verify/`),
  flagAnomaly: (id: number, data: any) => api.post(`/fund-flows/flows/${id}/flag-anomaly/`, data),
  
  getAnomalies: () => api.get('/fund-flows/anomalies/'),
  getAnomaly: (id: number) => api.get(`/fund-flows/anomalies/${id}/`),
  resolveAnomaly: (id: number, data: any) => api.patch(`/fund-flows/anomalies/${id}/resolve/`, data),
  getAnomaliesCount: () => api.get('/fund-flows/anomalies/count/'),
  
  getTrustIndicators: () => api.get('/fund-flows/trust-indicators/'),
  getTrustIndicator: (id: number) => api.get(`/fund-flows/trust-indicators/${id}/`),
  createTrustIndicator: (data: any) => api.post('/fund-flows/trust-indicators/', data),
  getTrustIndicatorsSummary: () => api.get('/fund-flows/trust-indicators/summary/'),
};

// Documents API
export const documentsAPI = {
  getDocuments: () => api.get('/documents/'),
  getDocument: (id: number) => api.get(`/documents/${id}/`),
  uploadDocument: (data: FormData) => api.post('/documents/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verifyDocument: (id: number, data: any) => api.post(`/documents/${id}/verify/`, data),
  
  searchDocuments: (params: any) => api.get('/documents/search/', { params }),
  getDocumentStatistics: () => api.get('/documents/statistics/'),
  
  getDocumentCategories: () => api.get('/documents/categories/list/'),
  getDocumentTemplates: () => api.get('/documents/templates/list/'),
  
  getDocumentVerifications: () => api.get('/documents/verifications/'),
  getDocumentVerification: (id: number) => api.get(`/documents/verifications/${id}/`),
};

// Analytics API
export const analyticsAPI = {
  getAnalyticsDashboard: () => api.get('/analytics/dashboard/'),
  
  getSearchFilters: () => api.get('/analytics/search-filters/'),
  createSearchFilter: (data: any) => api.post('/analytics/search-filters/', data),
  getSearchFilter: (id: number) => api.get(`/analytics/search-filters/${id}/`),
  updateSearchFilter: (id: number, data: any) => api.patch(`/analytics/search-filters/${id}/`, data),
  deleteSearchFilter: (id: number) => api.delete(`/analytics/search-filters/${id}/`),
  
  getAuditLogs: () => api.get('/analytics/audit-logs/'),
  
  getReports: () => api.get('/analytics/reports/'),
  createReport: (data: any) => api.post('/analytics/reports/', data),
  getReport: (id: number) => api.get(`/analytics/reports/${id}/`),
  
  getNotifications: () => api.get('/analytics/notifications/'),
  getNotification: (id: number) => api.get(`/analytics/notifications/${id}/`),
  markNotificationRead: (id: number) => api.get(`/analytics/notifications/${id}/mark-read/`),
  markAllNotificationsRead: () => api.post('/analytics/notifications/mark-all-read/'),
  getUnreadNotificationsCount: () => api.get('/analytics/notifications/unread-count/'),
  
  getSystemConfigurations: () => api.get('/analytics/configurations/'),
  getSystemConfiguration: (id: number) => api.get(`/analytics/configurations/${id}/`),
  updateSystemConfiguration: (id: number, data: any) => api.patch(`/analytics/configurations/${id}/`, data),
};

export default api;
