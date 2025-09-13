export interface DashboardMetrics {
  totalBudget: number;
  utilizedFunds: number;
  activeProjects: number;
  anomaliesCount: number;
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
  departmentId: string;
  status: string;
  minAmount?: number;
  maxAmount?: number;
  year: string;
  verificationStatus: string;
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
