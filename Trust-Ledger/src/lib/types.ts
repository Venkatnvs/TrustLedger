export interface DashboardMetrics {
  total_budget: number;
  utilized_funds: number;
  active_projects: number;
  anomalies_count: number;
}

export interface FundFlowNode {
  id: string;
  name: string;
  amount: number;
  type: 'source' | 'department' | 'project';
  status: 'verified' | 'under_review' | 'anomaly';
  position: { x: number; y: number };
}

export interface FundFlowLink {
  source: string;
  target: string;
  amount: number;
  status: 'verified' | 'under_review' | 'anomaly';
}

export interface SearchFilters {
  department_id?: string;
  status?: string;
  min_amount?: number;
  max_amount?: number;
  year?: string;
  verification_status?: string;
  min_budget?: number;
  max_budget?: number;
}

export interface ImpactMetric {
  id: string;
  projectId: string;
  metricType: 'beneficiaries' | 'efficiency' | 'satisfaction' | 'completion';
  value: number;
  unit: string;
  date: string;
  verified: boolean;
}

export interface RoleConfig {
  id: string;
  label: string;
  description: string;
  permissions: string[];
  color: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'invoice' | 'receipt' | 'contract' | 'report' | 'other';
  size: number;
  uploadedAt: string;
  verified: boolean;
  projectId?: string;
  fundFlowId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  departmentId: string;
  impactMetrics: ImpactMetric[];
}

export interface Department {
  id: string;
  name: string;
  budget: number;
  spent: number;
  projects: Project[];
}

export interface CommunityFeedback {
  id: string;
  user: string;
  user_name: string;
  project?: string;
  project_name?: string;
  department?: string;
  department_name?: string;
  fund_flow?: string;
  feedback_type: 'question' | 'suggestion' | 'concern' | 'complaint' | 'praise';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_public: boolean;
  is_anonymous: boolean;
  status: 'pending' | 'under_review' | 'responded' | 'resolved' | 'closed';
  response?: string;
  responded_by?: string;
  responded_by_name?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetVersion {
  id: string;
  project: string;
  project_name: string;
  version_number: number;
  budget_amount: number;
  change_reason: string;
  changed_by: string;
  changed_by_name: string;
  changed_at: string;
  previous_version?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  user_name: string;
  action: 'create' | 'update' | 'delete' | 'verify' | 'flag' | 'resolve';
  model_name: string;
  object_id: number;
  object_repr: string;
  changes: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface Anomaly {
  id: string;
  fund_flow: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_by: string;
  detected_at: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface TrustIndicator {
  id: string;
  department: string;
  transparency_score: number;
  community_oversight_score: number;
  response_time_score: number;
  document_completeness_score: number;
  overall_score: number;
  calculated_at: string;
}

export interface SearchResults<T> {
  results: T[];
  count: number;
  query: string;
  filters: SearchFilters;
}