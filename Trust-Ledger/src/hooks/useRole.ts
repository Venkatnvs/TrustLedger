import { useState, useCallback } from 'react';

export type UserRole = 'auditor' | 'citizen' | 'donor' | 'committee';

interface RoleConfig {
  label: string;
  description: string;
  permissions: string[];
}

const roleConfigs: Record<UserRole, RoleConfig> = {
  auditor: {
    label: 'Auditor',
    description: 'Review and verify fund flows, detect anomalies, and ensure compliance',
    permissions: ['view_all', 'verify_documents', 'detect_anomalies', 'generate_reports']
  },
  citizen: {
    label: 'Citizen',
    description: 'Monitor fund utilization, track project progress, and raise concerns',
    permissions: ['view_public', 'search_projects', 'report_issues', 'view_impact']
  },
  donor: {
    label: 'Donor',
    description: 'Track your contributions, see impact metrics, and ensure transparency',
    permissions: ['view_own_contributions', 'track_impact', 'view_reports', 'verify_usage']
  },
  committee: {
    label: 'Committee Member',
    description: 'Oversee project approvals, manage budgets, and coordinate implementations',
    permissions: ['approve_projects', 'manage_budgets', 'view_all', 'coordinate_teams']
  }
};

export function useRole() {
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');

  const switchRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
  }, []);

  const getRoleConfig = useCallback((role: UserRole) => {
    return roleConfigs[role];
  }, []);

  const roleConfig = getRoleConfig(currentRole);

  return {
    currentRole,
    switchRole,
    getRoleConfig,
    roleConfig
  };
}
