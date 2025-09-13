import axios from 'axios';
import { clearAuthTokens } from '@/utils/auth';

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
          console.log('Attempting to refresh token...');
          const response = await axios.post('http://localhost:8000/api/token/refresh/', {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          console.log('Token refreshed successfully');
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } else {
          console.log('No refresh token available');
          throw new Error('No refresh token');
        }
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
        // Refresh failed, clear tokens and redirect to login
        clearAuthTokens();
        throw refreshError;
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
  
  updateProfile: (id: number, data: any) => api.patch(`/auth/users/${id}/`, data),
  
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
  
  // Project Spending
  getProjectSpending: (projectId?: number) => api.get('/core/project-spending/', { params: projectId ? { project: projectId } : {} }),
  createProjectSpending: (data: any) => api.post('/core/project-spending/', data),
  getProjectSpendingRecord: (id: number) => api.get(`/core/project-spending/${id}/`),
  updateProjectSpending: (id: number, data: any) => api.patch(`/core/project-spending/${id}/`, data),
  deleteProjectSpending: (id: number) => api.delete(`/core/project-spending/${id}/`),
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

// Community Feedback API
export const communityFeedbackAPI = {
  getFeedback: (params?: string) => api.get(`/core/community-feedback/${params ? `?${params}` : ''}`),
  getFeedbackById: (id: number) => api.get(`/core/community-feedback/${id}/`),
  createFeedback: (data: any) => api.post('/core/community-feedback/', data),
  updateFeedback: (id: number, data: any) => api.patch(`/core/community-feedback/${id}/`, data),
  deleteFeedback: (id: number) => api.delete(`/core/community-feedback/${id}/`),
  respondToFeedback: (id: number, data: { response: string }) => api.post(`/core/community-feedback/${id}/respond/`, data),
  updateFeedbackStatus: (id: number, data: { status: string }) => api.patch(`/core/community-feedback/${id}/update-status/`, data),
};

// Budget Version API
export const budgetVersionAPI = {
  getBudgetVersions: () => api.get('/core/budget-versions/'),
  createBudgetVersion: (projectId: number, data: { budget_amount: number; change_reason: string }) => 
    api.post(`/core/projects/${projectId}/create-budget-version/`, data),
};

// Audit Log API
export const auditLogAPI = {
  getAuditLogs: () => api.get('/core/audit-logs/'),
};

// Search API
export const searchAPI = {
  searchTransactions: (params: any) => api.get('/fund-flows/search/transactions/', { params }),
  searchProjects: (params: any) => api.get('/fund-flows/search/projects/', { params }),
};

// Analytics API
export const analyticsAPI = {
  getAnalyticsDashboard: () => api.get('/analytics/dashboard/'),
  
  getSearchFilters: () => api.get('/analytics/search-filters/'),
  createSearchFilter: (data: any) => api.post('/analytics/search-filters/', data),
  getSearchFilter: (id: number) => api.get(`/analytics/search-filters/${id}/`),
  updateSearchFilter: (id: number, data: any) => api.patch(`/analytics/search-filters/${id}/`, data),
  deleteSearchFilter: (id: number) => api.delete(`/analytics/search-filters/${id}/`),
  
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

// AI Services API
export const aiAPI = {
  chat: (data: {
    query: string;
    context?: any;
    conversation_history?: Array<{role: string, content: string}>;
  }) => api.post('/ai/chat/', data),
  
  getCharacters: () => api.get('/ai/characters/'),
  
  getHealth: () => api.get('/ai/health/'),
};

// Fund Allocation API
export const fundAllocationAPI = {
  getFundAllocations: (projectId?: number) => {
    const params = projectId ? `?project_id=${projectId}` : '';
    return api.get(`/core/fund-allocations/${params}`);
  },
  
  getFundAllocation: (id: number) => api.get(`/core/fund-allocations/${id}/`),
  
  createFundAllocation: (data: any) => api.post('/core/fund-allocations/', data),
  
  updateFundAllocation: (id: number, data: any) => api.patch(`/core/fund-allocations/${id}/`, data),
  
  deleteFundAllocation: (id: number) => api.delete(`/core/fund-allocations/${id}/`),
};

export default api;
