import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RoleSelector } from "@/components/RoleSelector";
import { FundFlowDiagram } from "@/components/FundFlowDiagram";
import { TrustIndicators } from "@/components/TrustIndicators";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  TrendingUp, 
  Building2, 
  AlertTriangle, 
  Users, 
  FileCheck, 
  Eye, 
  Bot,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Target,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from "recharts";
import type { DashboardMetrics, Project, Department, CommunityFeedback, TrustIndicator } from "@/lib/types";
import { coreAPI, fundFlowsAPI, analyticsAPI, communityFeedbackAPI } from "@/lib/api";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";

export default function Dashboard() {
  const { currentRole, roleConfig } = useRole();
  const { toast } = useToast();

  // Fetch all dashboard data
  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const response = await coreAPI.getDashboardMetrics();
      return response.data;
    },
    refetchInterval: 30000,
  });

  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await coreAPI.getDepartments();
      return response.data.results;
    },
  });

  const { data: trustIndicators, isLoading: isLoadingTrust } = useQuery<TrustIndicator[]>({
    queryKey: ["trust-indicators"],
    queryFn: async () => {
      const response = await fundFlowsAPI.getTrustIndicators();
      return response.data.results;
    },
  });

  const { data: communityFeedback, isLoading: isLoadingFeedback } = useQuery<CommunityFeedback[]>({
    queryKey: ["community-feedback"],
    queryFn: async () => {
      const response = await communityFeedbackAPI.getFeedback();
      return response.data.results;
    },
  });

  const { data: anomalies, isLoading: isLoadingAnomalies } = useQuery({
    queryKey: ["anomalies"],
    queryFn: async () => {
      const response = await fundFlowsAPI.getAnomalies();
      return response.data.results;
    },
  });

  const { data: projectStatusSummary } = useQuery({
    queryKey: ["project-status-summary"],
    queryFn: async () => {
      const response = await coreAPI.getProjectStatusSummary();
      return response.data;
    },
  });

  const { data: departmentPerformance } = useQuery({
    queryKey: ["department-performance"],
    queryFn: async () => {
      const response = await coreAPI.getDepartmentPerformance();
      return response.data;
    },
  });

  const isLoading = isLoadingMetrics || isLoadingProjects || isLoadingDepartments;

  if (metricsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">
            Unable to fetch dashboard metrics. Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  // Calculate derived metrics
  const totalBudget = projects?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) || 0;
  const totalSpent = projects?.reduce((sum, p) => sum + (Number(p.spent) || 0), 0) || 0;
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - totalSpent;

  const projectStatusCounts = {
    active: projects?.filter(p => p.status === 'active').length || 0,
    completed: projects?.filter(p => p.status === 'completed').length || 0,
    planning: projects?.filter(p => p.status === 'planning').length || 0,
    cancelled: projects?.filter(p => p.status === 'cancelled').length || 0,
  };

  const recentFeedback = communityFeedback?.slice(0, 5) || [];
  const pendingAnomalies = anomalies?.filter((a: any) => !a.resolved).length || 0;

  // Chart data
  const budgetUtilizationData = projects?.slice(0, 8).map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    budget: Number(project.budget) || 0,
    spent: Number(project.spent) || 0,
    utilization: project.budget > 0 ? ((Number(project.spent) || 0) / Number(project.budget)) * 100 : 0
  })) || [];

  const projectStatusData = [
    { name: 'Active', value: projectStatusCounts.active, color: '#3b82f6' },
    { name: 'Completed', value: projectStatusCounts.completed, color: '#10b981' },
    { name: 'Planning', value: projectStatusCounts.planning, color: '#f59e0b' },
    { name: 'Cancelled', value: projectStatusCounts.cancelled, color: '#ef4444' },
  ];

  const monthlyTrendData = [
    { month: 'Jan', budget: 12000000, spent: 8500000 },
    { month: 'Feb', budget: 15000000, spent: 9200000 },
    { month: 'Mar', budget: 18000000, spent: 11000000 },
    { month: 'Apr', budget: 20000000, spent: 12500000 },
    { month: 'May', budget: 22000000, spent: 14000000 },
    { month: 'Jun', budget: 25000000, spent: 16000000 },
  ];

  return (
    <main className="min-h-screen bg-background" data-testid="page-dashboard">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">TrustLedger Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive overview of financial transparency and fund management</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Refresh all queries
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <section className="container mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Budget */}
          <Card className="shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +12%
                </Badge>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {formatCurrency(totalBudget)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Total Budget Allocated</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Funds Utilized */}
          <Card className="shadow-sm border-l-4 border-l-accent hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <Badge variant="secondary" className="bg-accent/10 text-accent">
                  {utilizationRate.toFixed(1)}%
                </Badge>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {formatCurrency(totalSpent)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Funds Utilized</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="shadow-sm border-l-4 border-l-verified hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-verified/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-verified" />
                </div>
                <Badge variant="secondary" className="bg-verified/10 text-verified">
                  {projectStatusCounts.completed} completed
                </Badge>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {projectStatusCounts.active}
                  </h3>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Anomalies */}
          <Card className="shadow-sm border-l-4 border-l-warning hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <Badge variant="secondary" className="bg-warning/10 text-warning">
                  {pendingAnomalies} pending
                </Badge>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {anomalies?.length || 0}
                  </h3>
                  <p className="text-sm text-muted-foreground">Anomalies Detected</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Budget Utilization Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Budget Utilization by Project</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetUtilizationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                      <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                      <Bar dataKey="spent" fill="#10b981" name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Project Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5" />
                    <span>Project Status Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend and Fund Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Monthly Budget vs Spending Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                      <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                      <Line type="monotone" dataKey="spent" stroke="#10b981" strokeWidth={3} name="Spent" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Fund Flow Visualization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FundFlowDiagram />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Department Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departments?.slice(0, 5).map((dept, index) => {
                      const deptProjects = projects?.filter(p => p.departmentId === dept.id) || [];
                      const deptBudget = deptProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
                      const deptSpent = deptProjects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
                      const deptUtilization = deptBudget > 0 ? (deptSpent / deptBudget) * 100 : 0;
                      
                      return (
                        <div key={dept.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{dept.name}</span>
                            <Badge variant="outline">{deptUtilization.toFixed(1)}%</Badge>
                          </div>
                          <Progress value={deptUtilization} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatCurrency(deptSpent)}</span>
                            <span>{formatCurrency(deptBudget)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle>Trust Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <TrustIndicators />
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                      <div className="w-8 h-8 bg-verified/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-verified" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Project completed</p>
                        <p className="text-xs text-muted-foreground">Education Infrastructure</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2h ago</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                      <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Anomaly detected</p>
                        <p className="text-xs text-muted-foreground">Healthcare Fund Flow</p>
                      </div>
                      <span className="text-xs text-muted-foreground">4h ago</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Document verified</p>
                        <p className="text-xs text-muted-foreground">Budget Allocation Report</p>
                      </div>
                      <span className="text-xs text-muted-foreground">6h ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Status Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Status Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-verified">{projectStatusCounts.completed}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-primary">{projectStatusCounts.active}</div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </div>
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-warning">{projectStatusCounts.planning}</div>
                      <div className="text-sm text-muted-foreground">Planning</div>
                    </div>
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-destructive">{projectStatusCounts.cancelled}</div>
                      <div className="text-sm text-muted-foreground">Cancelled</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Projects by Budget */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Projects by Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects?.slice(0, 5)
                      .sort((a, b) => (Number(b.budget) || 0) - (Number(a.budget) || 0))
                      .map((project, index) => (
                        <div key={project.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground">Department</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(Number(project.budget) || 0)}</p>
                            <Badge variant="outline" className="text-xs">
                              {project.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Community Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Community Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentFeedback.map((feedback) => (
                      <div key={feedback.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {feedback.feedback_type}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                feedback.priority === 'urgent' ? 'text-destructive border-destructive' :
                                feedback.priority === 'high' ? 'text-warning border-warning' :
                                'text-muted-foreground'
                              }`}
                            >
                              {feedback.priority}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-medium mb-1">{feedback.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {feedback.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            by {feedback.is_anonymous ? 'Anonymous' : feedback.user_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {feedback.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Community Oversight Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Community Oversight</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
                      <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                      <div className="text-3xl font-bold text-primary mb-2">247</div>
                      <div className="text-sm text-muted-foreground">Active Community Watchers</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border border-border rounded-lg">
                        <div className="text-2xl font-bold text-accent">12</div>
                        <div className="text-xs text-muted-foreground">Questions This Month</div>
                      </div>
                      <div className="text-center p-4 border border-border rounded-lg">
                        <div className="text-2xl font-bold text-warning">3</div>
                        <div className="text-xs text-muted-foreground">Issues Flagged</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
