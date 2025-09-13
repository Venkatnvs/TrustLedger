import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ImpactVisualization } from "@/components/ImpactVisualization";
import { TrustIndicators } from "@/components/TrustIndicators";
import { useRole } from "@/hooks/useRole";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Filter,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building2,
  DollarSign,
  Target,
  Calendar,
  Activity,
  Eye,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Award,
  Shield,
  FileText,
  Zap
} from "lucide-react";
import { 
  LineChart as RechartsLineChart, 
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
  ComposedChart,
  ScatterChart,
  Scatter
} from "recharts";
import type { DashboardMetrics, Project, Department, CommunityFeedback, TrustIndicator } from "@/lib/types";
import { coreAPI, fundFlowsAPI, communityFeedbackAPI, analyticsAPI } from "@/lib/api";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";

export default function Analytics() {
  const { currentRole } = useRole();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("2024-q3");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const { data: metrics, isLoading, error, refetch: refetchMetrics } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const response = await coreAPI.getDashboardMetrics();
      return response.data;
    },
    refetchInterval: 30000,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await coreAPI.getDepartments();
      return response.data.results;
    },
  });

  const { data: anomalies, isLoading: anomaliesLoading } = useQuery({
    queryKey: ["anomalies"],
    queryFn: async () => {
      const response = await fundFlowsAPI.getAnomalies();
      return response.data.results;
    },
  });

  const { data: communityReports, isLoading: communityLoading } = useQuery({
    queryKey: ["community-feedback"],
    queryFn: async () => {
      const response = await communityFeedbackAPI.getFeedback();
      return response.data.results;
    },
  });

  const { data: trustIndicators, isLoading: trustLoading } = useQuery({
    queryKey: ["trust-indicators"],
    queryFn: async () => {
      const response = await fundFlowsAPI.getTrustIndicators();
      return response.data.results;
    },
  });

  const { data: departmentPerformance, isLoading: deptPerfLoading } = useQuery({
    queryKey: ["department-performance"],
    queryFn: async () => {
      const response = await coreAPI.getDepartmentPerformance();
      return response.data;
    },
  });

  const { data: projectStatusSummary, isLoading: statusLoading } = useQuery({
    queryKey: ["project-status-summary"],
    queryFn: async () => {
      const response = await coreAPI.getProjectStatusSummary();
      return response.data;
    },
  });

  // Calculate derived metrics
  const totalProjects = projects?.length || 0;
  const completedProjects = projects?.filter((p: Project) => p.status === 'completed').length || 0;
  const activeProjects = projects?.filter((p: Project) => p.status === 'active').length || 0;
  const planningProjects = projects?.filter((p: Project) => p.status === 'planning').length || 0;
  const cancelledProjects = projects?.filter((p: Project) => p.status === 'cancelled').length || 0;
  
  const totalBudget = projects?.reduce((sum: number, p: Project) => sum + (p.budget || 0), 0) || 0;
  const totalSpent = projects?.reduce((sum: number, p: Project) => sum + (p.spent || 0), 0) || 0;
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  const avgProjectDuration = projects?.length > 0 ? 
    projects.reduce((sum: number, p: Project) => {
      if (p.startDate && p.endDate) {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }
      return sum;
    }, 0) / projects.length : 0;

  // Chart data preparation
  const budgetDistributionData = departments?.map((dept: Department) => ({
    name: dept.name,
    budget: dept.budget || 0,
    spent: dept.spent || 0,
    utilization: (dept.budget || 0) > 0 ? ((dept.spent || 0) / (dept.budget || 0)) * 100 : 0
  })) || [];

  const projectStatusData = [
    { name: 'Completed', value: completedProjects, color: '#10b981' },
    { name: 'Active', value: activeProjects, color: '#3b82f6' },
    { name: 'Planning', value: planningProjects, color: '#f59e0b' },
    { name: 'Cancelled', value: cancelledProjects, color: '#ef4444' }
  ];

  const monthlySpendingData = [
    { month: 'Jan', spent: 1200000, budget: 1500000 },
    { month: 'Feb', spent: 1350000, budget: 1500000 },
    { month: 'Mar', spent: 1420000, budget: 1500000 },
    { month: 'Apr', spent: 1280000, budget: 1500000 },
    { month: 'May', spent: 1550000, budget: 1500000 },
    { month: 'Jun', spent: 1480000, budget: 1500000 },
    { month: 'Jul', spent: 1620000, budget: 1500000 },
    { month: 'Aug', spent: 1580000, budget: 1500000 },
    { month: 'Sep', spent: 1450000, budget: 1500000 }
  ];


  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Analytics</h2>
          <p className="text-muted-foreground">Unable to fetch analytics data. Please try again.</p>
          <Button onClick={() => refetchMetrics()} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background" data-testid="page-analytics">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">Analytics & Reports</h1>
              <p className="text-muted-foreground">Comprehensive insights into fund utilization, project performance, and transparency metrics</p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedTimePeriod} onValueChange={setSelectedTimePeriod}>
                <SelectTrigger className="w-[150px]" data-testid="select-time-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-q3">2024 Q3</SelectItem>
                  <SelectItem value="2024-q2">2024 Q2</SelectItem>
                  <SelectItem value="2024-q1">2024 Q1</SelectItem>
                  <SelectItem value="2023">2023 Full Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" data-testid="button-export-report">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" onClick={() => refetchMetrics()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments?.map((dept: Department) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects?.map((project: Project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="shadow-sm" data-testid="card-budget-utilization">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary" className={budgetUtilization > 80 ? "bg-green-100 text-green-800" : budgetUtilization > 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                  {budgetUtilization > 80 ? "Excellent" : budgetUtilization > 60 ? "Good" : "Needs Attention"}
                </Badge>
              </div>
              {projectsLoading || departmentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-utilization-rate">
                    {Math.round(budgetUtilization)}%
                  </h3>
                  <p className="text-sm text-muted-foreground">Budget Utilization</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-project-completion">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <Badge variant="secondary" className="bg-accent/10 text-accent">
                  {completedProjects > 0 ? `${Math.round((completedProjects / totalProjects) * 100)}%` : "0%"}
                </Badge>
              </div>
              {projectsLoading || departmentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-completion-rate">
                    {completedProjects}
                  </h3>
                  <p className="text-sm text-muted-foreground">Completed Projects</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeProjects} active, {planningProjects} planning
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-total-projects">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Total
                </Badge>
              </div>
              {projectsLoading || departmentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground">
                    {totalProjects}
                  </h3>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {departments?.length || 0} departments
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-anomalies">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <Badge variant="secondary" className={anomalies?.length > 5 ? "bg-red-100 text-red-800" : anomalies?.length > 0 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                  {anomalies?.length > 5 ? "High" : anomalies?.length > 0 ? "Medium" : "Low"}
                </Badge>
              </div>
              {projectsLoading || departmentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground">
                    {anomalies?.length || 0}
                  </h3>
                  <p className="text-sm text-muted-foreground">Anomalies Detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {anomalies?.filter((a: any) => !a.resolved).length || 0} unresolved
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-community-engagement">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-secondary-foreground" />
                </div>
                <Badge variant="secondary">
                  {communityReports?.filter((r: CommunityFeedback) => r.status === 'pending').length || 0} pending
                </Badge>
              </div>
              {projectsLoading || departmentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-community-reports">
                    {communityReports?.length || 0}
                  </h3>
                  <p className="text-sm text-muted-foreground">Community Reports</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {communityReports?.filter((r: CommunityFeedback) => r.status === 'resolved').length || 0} resolved
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-avg-duration">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Average
                </Badge>
              </div>
              {projectsLoading || departmentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground">
                    {Math.round(avgProjectDuration / 30)}m
                  </h3>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(avgProjectDuration)} days
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts and Visualizations */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
            <TabsTrigger value="projects">Project Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project Status Distribution */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5" />
                    <span>Project Status Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectsLoading || departmentsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
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
                  )}
                </CardContent>
              </Card>

              {/* Monthly Spending Trend */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="w-5 h-5" />
                    <span>Monthly Spending Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectsLoading || departmentsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={monthlySpendingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="spent" stroke="#8884d8" strokeWidth={2} name="Spent" />
                        <Line type="monotone" dataKey="budget" stroke="#82ca9d" strokeWidth={2} name="Budget" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Budget Distribution by Department */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Budget Distribution by Department</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectsLoading || departmentsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={budgetDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                        <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Budget Utilization by Department */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Budget Utilization by Department</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectsLoading || departmentsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <div className="space-y-4">
                      {budgetDistributionData.map((dept: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{dept.name}</span>
                            <span className="text-muted-foreground">{Math.round(dept.utilization)}%</span>
                          </div>
                          <Progress value={dept.utilization} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatCurrency(dept.spent)}</span>
                            <span>{formatCurrency(dept.budget)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project Performance Scatter */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Project Performance Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectsLoading || departmentsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart data={projects?.map((p: Project) => ({
                        budget: p.budget,
                        spent: p.spent,
                        utilization: p.budget > 0 ? (p.spent / p.budget) * 100 : 0,
                        name: p.name
                      }))}>
                        <CartesianGrid />
                        <XAxis type="number" dataKey="budget" name="Budget" />
                        <YAxis type="number" dataKey="spent" name="Spent" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter dataKey="utilization" fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Project Timeline */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Project Timeline Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectsLoading || departmentsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <div className="space-y-4">
                      {projects?.slice(0, 5).map((project: Project) => (
                        <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{project.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {project.startDate} - {project.endDate || 'Ongoing'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={project.status === 'completed' ? 'default' : project.status === 'active' ? 'secondary' : 'outline'}>
                              {project.status}
                            </Badge>
                            <div className="text-right text-xs">
                              <div>{formatCurrency(project.spent)}</div>
                              <div className="text-muted-foreground">of {formatCurrency(project.budget)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Spending vs Budget Trend */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Spending vs Budget Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectsLoading || departmentsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={monthlySpendingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Area type="monotone" dataKey="spent" stackId="1" stroke="#8884d8" fill="#8884d8" name="Spent" />
                        <Area type="monotone" dataKey="budget" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Budget" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Department Performance Comparison */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Department Performance Ranking</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectsLoading || departmentsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <div className="space-y-4">
                      {budgetDistributionData
                        .sort((a: any, b: any) => b.utilization - a.utilization)
                        .map((dept: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium">{dept.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {Math.round(dept.utilization)}% utilization
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatCurrency(dept.spent)}</div>
                              <div className="text-xs text-muted-foreground">of {formatCurrency(dept.budget)}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Impact Visualization */}
        <div className="mb-8">
          <ImpactVisualization />
        </div>

        {/* Trust & Compliance Dashboard */}
        {(currentRole === 'auditor' || currentRole === 'committee') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <TrustIndicators />
            
            {/* Anomaly Analysis */}
            <Card className="shadow-sm" data-testid="card-anomaly-analysis">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Anomaly Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-anomaly/10 rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">High Risk</h4>
                      <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                    </div>
                    <span className="text-xl font-bold text-anomaly" data-testid="text-high-risk-anomalies">
                      {anomalies?.filter((a: any) => a.severity >= 8).length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Medium Risk</h4>
                      <p className="text-xs text-muted-foreground">Monitor closely</p>
                    </div>
                    <span className="text-xl font-bold text-warning" data-testid="text-medium-risk-anomalies">
                      {anomalies?.filter((a: any) => a.severity >= 5 && a.severity < 8).length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Low Risk</h4>
                      <p className="text-xs text-muted-foreground">Minor irregularities</p>
                    </div>
                    <span className="text-xl font-bold text-muted-foreground" data-testid="text-low-risk-anomalies">
                      {anomalies?.filter((a: any) => a.severity < 5).length || 0}
                    </span>
                  </div>
                  
                  <Button variant="outline" className="w-full" data-testid="button-view-all-anomalies">
                    View All Anomalies
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="shadow-sm" data-testid="card-performance-metrics">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Project Duration</span>
                    <span className="font-medium">{Math.round(avgProjectDuration / 30)} months</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Project Completion Rate</span>
                    <span className="font-medium text-green-600">
                      {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Budget Utilization</span>
                    <span className="font-medium text-blue-600">{Math.round(budgetUtilization)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Projects</span>
                    <span className="font-medium">{activeProjects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Departments</span>
                    <span className="font-medium">{departments?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-sm" data-testid="card-department-comparison">
            <CardHeader>
              <CardTitle>Department Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {projectsLoading || departmentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {budgetDistributionData
                    .sort((a: any, b: any) => b.utilization - a.utilization)
                    .slice(0, 5)
                    .map((dept: any, index: number) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-gradient-to-r from-green-100 to-blue-100' : 'border border-border'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-orange-500' : 'bg-gray-400'
                          }`}>
                            <span className="text-sm font-bold text-white">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{dept.name}</h4>
                            <p className="text-xs text-muted-foreground">{Math.round(dept.utilization)}% utilization</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(dept.spent)}</div>
                          <div className="text-xs text-muted-foreground">of {formatCurrency(dept.budget)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-recent-activities">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Recent Project Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects?.slice(0, 5).map((project: Project) => (
                  <div key={project.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      project.status === 'completed' ? 'bg-green-500' : 
                      project.status === 'active' ? 'bg-blue-500' : 
                      project.status === 'planning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Status: {project.status}</span>
                        <span>Budget: {formatCurrency(project.budget)}</span>
                        <span>Spent: {formatCurrency(project.spent)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export and Actions */}
        <div className="mt-8 flex justify-end space-x-4">
          <Button variant="outline" data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" data-testid="button-export-pdf">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button data-testid="button-generate-report">
            <Zap className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>
    </main>
  );
}
