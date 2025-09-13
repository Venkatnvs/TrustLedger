import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FundFlowCreationModal } from './FundFlowCreationModal';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import { coreAPI, fundFlowsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';

interface Project {
  id: number;
  name: string;
  budget: number;
  spent: number;
  remaining_budget: number;
  completion_percentage: number;
  status: string;
  department?: {
    id: number;
    name: string;
  };
  department_name?: string;
  start_date: string;
  end_date: string;
}

interface FundFlow {
  id: number;
  amount: string | number;
  status: string;
  transaction_date: string;
  description?: string;
  source_name: string;
  target_name: string;
}

export function BudgetSpendingTracker() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  const { data: fundFlows, isLoading: flowsLoading } = useQuery({
    queryKey: ['fund-flows'],
    queryFn: async () => {
      const response = await fundFlowsAPI.getFundFlows();
      return response.data.results;
    },
  });

  if (projectsLoading || flowsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Spending Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalBudget = projects?.reduce((sum: number, project: Project) => sum + Number(project.budget), 0) || 0;
  const totalSpent = projects?.reduce((sum: number, project: Project) => sum + Number(project.spent), 0) || 0;
  const totalRemaining = totalBudget - totalSpent;
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const recentFlows = fundFlows?.slice(0, 5) || [];
  const totalFlows = fundFlows?.length || 0;
  const verifiedFlows = fundFlows?.filter((flow: FundFlow) => flow.status === 'verified').length || 0;
  const pendingFlows = fundFlows?.filter((flow: FundFlow) => flow.status === 'under_review').length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-verified bg-verified/10';
      case 'under_review': return 'text-warning bg-warning/10';
      case 'anomaly': return 'text-anomaly bg-anomaly/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'under_review': return <AlertTriangle className="w-4 h-4" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Budget Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Budget Utilization</span>
              <span className="text-sm text-muted-foreground">{overallProgress.toFixed(1)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{formatCurrency(totalBudget)}</div>
                <div className="text-muted-foreground">Total Budget</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-verified">{formatCurrency(totalSpent)}</div>
                <div className="text-muted-foreground">Spent</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-accent">{formatCurrency(totalRemaining)}</div>
                <div className="text-muted-foreground">Remaining</div>
              </div>
            </div>
          </div>

          {/* Project Status Summary */}
          <div className="space-y-3">
            <h4 className="font-medium">Project Status</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">Active Projects</span>
                <Badge variant="secondary">
                  {projects?.filter((p: Project) => p.status === 'active').length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">Completed</span>
                <Badge variant="secondary">
                  {projects?.filter((p: Project) => p.status === 'completed').length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">Planning</span>
                <Badge variant="secondary">
                  {projects?.filter((p: Project) => p.status === 'planning').length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">On Hold</span>
                <Badge variant="secondary">
                  {projects?.filter((p: Project) => p.status === 'on_hold').length || 0}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Fund Flows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Recent Fund Flows</span>
            </div>
            <FundFlowCreationModal />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Fund Flow Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">{totalFlows}</div>
                <div className="text-xs text-muted-foreground">Total Flows</div>
              </div>
              <div>
                <div className="text-lg font-bold text-verified">{verifiedFlows}</div>
                <div className="text-xs text-muted-foreground">Verified</div>
              </div>
              <div>
                <div className="text-lg font-bold text-warning">{pendingFlows}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>

            {/* Recent Flows List */}
            <div className="space-y-3">
              <h4 className="font-medium">Recent Transactions</h4>
              {recentFlows.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentFlows.map((flow: FundFlow) => (
                    <div key={flow.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`p-1 rounded flex-shrink-0 ${getStatusColor(flow.status)}`}>
                          {getStatusIcon(flow.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {flow.source_name} → {flow.target_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(flow.transaction_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-2 flex-shrink-0">
                        <div className="text-sm font-bold text-primary">
                          {formatCurrency(Number(flow.amount))}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {flow.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No fund flows yet</p>
                  <p className="text-xs">Create your first fund flow to get started</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
