import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Calendar
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/types";
import { coreAPI, fundFlowsAPI, communityFeedbackAPI } from "@/lib/api";

export default function Analytics() {
  const { currentRole } = useRole();

  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const response = await coreAPI.getDashboardMetrics();
      return response.data;
    },
    refetchInterval: 30000,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  const { data: anomalies } = useQuery({
    queryKey: ["anomalies"],
    queryFn: async () => {
      const response = await fundFlowsAPI.getAnomalies();
      return response.data.results;
    },
  });

  const { data: communityReports } = useQuery({
    queryKey: ["community-feedback"],
    queryFn: async () => {
      const response = await communityFeedbackAPI.getFeedback();
      return response.data.results;
    },
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Analytics</h2>
          <p className="text-muted-foreground">Unable to fetch analytics data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background" data-testid="page-analytics">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">Analytics & Reports</h1>
              <p className="text-muted-foreground">Comprehensive insights into fund utilization, project performance, and transparency metrics</p>
            </div>
            <div className="flex items-center space-x-2">
              <Select defaultValue="2024-q3">
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
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm" data-testid="card-budget-utilization">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary" className="bg-verified/10 text-verified">
                  +5.2%
                </Badge>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-utilization-rate">
                    {metrics?.total_budget && metrics?.utilized_funds ? 
                      Math.round((metrics.utilized_funds / metrics.total_budget) * 100) : 0
                    }%
                  </h3>
                  <p className="text-sm text-muted-foreground">Budget Utilization</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-transparency-score">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-verified/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-verified" />
                </div>
                <Badge variant="secondary" className="bg-verified/10 text-verified">
                  Excellent
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-foreground" data-testid="text-transparency-score">92</h3>
              <p className="text-sm text-muted-foreground">Transparency Score</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-project-completion">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <Badge variant="secondary" className="bg-accent/10 text-accent">
                  On Track
                </Badge>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground" data-testid="text-completion-rate">
                    {projects ? 
                      Math.round((projects.filter((p: any) => p.status === 'completed').length / projects.length) * 100) : 0
                    }%
                  </h3>
                  <p className="text-sm text-muted-foreground">Project Completion Rate</p>
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
                  +12
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-foreground" data-testid="text-community-reports">
                {communityReports?.length || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Community Reports</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Budget Flow Chart */}
          <Card className="shadow-sm" data-testid="card-budget-flow-chart">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5" />
                <span>Budget Distribution by Department</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Placeholder for actual chart - would use recharts in production */}
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Interactive budget distribution chart</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mx-auto mb-1"></div>
                      <span className="text-muted-foreground">Education (42%)</span>
                    </div>
                    <div className="text-center">
                      <div className="w-4 h-4 bg-green-500 rounded mx-auto mb-1"></div>
                      <span className="text-muted-foreground">Healthcare (28%)</span>
                    </div>
                    <div className="text-center">
                      <div className="w-4 h-4 bg-orange-500 rounded mx-auto mb-1"></div>
                      <span className="text-muted-foreground">Infrastructure (30%)</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Chart */}
          <Card className="shadow-sm" data-testid="card-timeline-chart">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="w-5 h-5" />
                <span>Fund Utilization Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Placeholder for actual chart */}
                  <div className="h-48 bg-gradient-to-r from-muted/30 to-background rounded-lg flex items-end justify-between p-6">
                    <div className="flex flex-col items-center">
                      <div className="w-8 bg-primary rounded-t" style={{ height: "60%" }}></div>
                      <span className="text-xs text-muted-foreground mt-2">Q1</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 bg-primary rounded-t" style={{ height: "75%" }}></div>
                      <span className="text-xs text-muted-foreground mt-2">Q2</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 bg-primary rounded-t" style={{ height: "85%" }}></div>
                      <span className="text-xs text-muted-foreground mt-2">Q3</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 bg-accent rounded-t" style={{ height: "95%" }}></div>
                      <span className="text-xs text-muted-foreground mt-2">Q4</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Quarterly fund utilization (₹ in Crores)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                    <span className="font-medium">8.2 months</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">On-time Completion Rate</span>
                    <span className="font-medium text-verified">94%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Budget Variance</span>
                    <span className="font-medium text-primary">+2.3%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stakeholder Satisfaction</span>
                    <span className="font-medium">4.6/5.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Documentation Compliance</span>
                    <span className="font-medium text-verified">98%</span>
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
              {isLoading ? (
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
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-verified/10 to-primary/10 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-verified rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Education</h4>
                        <p className="text-xs text-muted-foreground">98% compliance</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-verified">A+</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Healthcare</h4>
                        <p className="text-xs text-muted-foreground">94% compliance</p>
                      </div>
                    </div>
                    <Badge variant="secondary">A</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Infrastructure</h4>
                        <p className="text-xs text-muted-foreground">86% compliance</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-warning border-warning">B+</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-upcoming-milestones">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Upcoming Milestones</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-primary/5 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">Q4 Budget Review</h4>
                    <p className="text-sm text-muted-foreground">Annual budget assessment and planning</p>
                    <span className="text-xs text-primary">Due in 15 days</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-accent/5 rounded-lg">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">Infrastructure Phase 2</h4>
                    <p className="text-sm text-muted-foreground">Road maintenance project completion</p>
                    <span className="text-xs text-accent">Due in 28 days</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-verified/5 rounded-lg">
                  <div className="w-2 h-2 bg-verified rounded-full mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">Transparency Audit</h4>
                    <p className="text-sm text-muted-foreground">External compliance verification</p>
                    <span className="text-xs text-verified">Due in 42 days</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
