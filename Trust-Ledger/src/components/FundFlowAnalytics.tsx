import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { coreAPI, fundFlowsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';

interface FundFlow {
  id: number;
  amount: string | number;
  status: string;
  transaction_date: string;
  source_name: string;
  target_name: string;
}

interface Project {
  id: number;
  name: string;
  budget: number;
  spent: number;
  department?: {
    id: number;
    name: string;
  };
  department_name?: string;
}

export function FundFlowAnalytics() {
  const { data: fundFlows, isLoading: flowsLoading } = useQuery({
    queryKey: ['fund-flows'],
    queryFn: async () => {
      const response = await fundFlowsAPI.getFundFlows();
      return response.data.results;
    },
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  if (flowsLoading || projectsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                  <div className="h-2 bg-muted rounded animate-pulse w-full"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate analytics
  const totalFlows = fundFlows?.length || 0;
  const totalAmount = fundFlows?.reduce((sum: number, flow: FundFlow) => sum + Number(flow?.amount || 0), 0) || 0;
  const verifiedFlows = fundFlows?.filter((flow: FundFlow) => flow?.status === 'verified').length || 0;
  const pendingFlows = fundFlows?.filter((flow: FundFlow) => flow?.status === 'under_review').length || 0;
  const anomalyFlows = fundFlows?.filter((flow: FundFlow) => flow?.status === 'anomaly').length || 0;
  
  const verificationRate = totalFlows > 0 ? (verifiedFlows / totalFlows) * 100 : 0;
  const averageFlowAmount = totalFlows > 0 ? totalAmount / totalFlows : 0;

  // Monthly spending trend (last 6 months)
  const monthlySpending = fundFlows?.reduce((acc: any, flow: FundFlow) => {
    if (!flow?.transaction_date) return acc;
    const date = new Date(flow.transaction_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { amount: 0, count: 0 };
    }
    acc[monthKey].amount += Number(flow?.amount || 0);
    acc[monthKey].count += 1;
    return acc;
  }, {}) || {};

  const monthlyData = Object.entries(monthlySpending)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]: [string, any]) => ({
      month,
      amount: data.amount,
      count: data.count
    }));

  // Department spending
  const departmentSpending = projects?.reduce((acc: any, project: Project) => {
    // Handle both department object and department_name string
    const deptName = project?.department?.name || project?.department_name || 'Unknown Department';
    if (!acc[deptName]) {
      acc[deptName] = { budget: 0, spent: 0 };
    }
    acc[deptName].budget += Number(project?.budget) || 0;
    acc[deptName].spent += Number(project?.spent) || 0;
    return acc;
  }, {}) || {};

  const departmentData = Object.entries(departmentSpending).map(([dept, data]: [string, any]) => ({
    department: dept,
    budget: Number(data.budget),
    spent: Number(data.spent),
    utilization: Number(data.budget) > 0 ? (Number(data.spent) / Number(data.budget)) * 100 : 0
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="secondary">Total</Badge>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-sm text-muted-foreground">Total Fund Flows</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-verified/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-verified" />
              </div>
              <Badge variant="secondary">{verificationRate.toFixed(1)}%</Badge>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {verifiedFlows}
            </div>
            <p className="text-sm text-muted-foreground">Verified Flows</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <Badge variant="secondary">{pendingFlows}</Badge>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {pendingFlows}
            </div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-accent" />
              </div>
              <Badge variant="secondary">Avg</Badge>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(averageFlowAmount)}
            </div>
            <p className="text-sm text-muted-foreground">Average Flow</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Spending Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="w-5 h-5" />
            <span>Department Spending Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentData.map((dept) => (
              <div key={dept.department} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dept.department}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      {formatCurrency(dept.spent)} / {formatCurrency(dept.budget)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dept.utilization.toFixed(1)}% utilized
                    </div>
                  </div>
                </div>
                <Progress value={dept.utilization} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Monthly Spending Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.length > 0 ? (
              <div className="space-y-3">
                {monthlyData.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {month.count} transactions
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(month.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No spending data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
