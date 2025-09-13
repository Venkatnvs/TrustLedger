import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ImpactVisualization } from "@/components/ImpactVisualization";
import { BudgetManagement } from "@/components/BudgetManagement";
import { AnomalyDetection } from "@/components/AnomalyDetection";
import { useRole } from "@/hooks/useRole";
import { 
  Search, 
  Building2, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  FileText,
  BarChart3
} from "lucide-react";
import { coreAPI } from "@/lib/api";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  budget: number;
  spent: number;
  department?: {
    id: number;
    name: string;
  };
  vendor?: {
    id: number;
    name: string;
  };
  start_date?: string;
  expected_beneficiaries?: number;
  impact_score?: number;
  verification_status?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

interface Department {
  id: number;
  name: string;
}

export default function Projects() {
  const { currentRole } = useRole();
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects", { departmentId: departmentFilter === "all" ? undefined : departmentFilter, status: statusFilter === "all" ? undefined : statusFilter }],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await coreAPI.getDepartments();
      return response.data.results;
    },
  });

  const filteredProjects = projects?.filter((project: Project) => {
    if (!searchQuery) return true;
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           project.description?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "approved": return <TrendingUp className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "cancelled": return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-verified bg-verified/10 border-verified";
      case "approved": return "text-primary bg-primary/10 border-primary";
      case "pending": return "text-warning bg-warning/10 border-warning";
      case "cancelled": return "text-anomaly bg-anomaly/10 border-anomaly";
      default: return "text-muted-foreground bg-muted/10 border-muted";
    }
  };

  const getVerificationColor = (status?: string) => {
    switch (status) {
      case "verified": return "text-verified border-verified";
      case "under_review": return "text-warning border-warning";
      case "anomaly": return "text-anomaly border-anomaly";
      default: return "text-muted-foreground border-muted";
    }
  };

  const calculateProgress = (project: Project) => {
    const allocated = project.spent;
    const total = project.budget;
    return total > 0 ? Math.round((allocated / total) * 100) : 0;
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Projects</h2>
          <p className="text-muted-foreground">Unable to fetch project data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background" data-testid="page-projects">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">Projects</h1>
              <p className="text-muted-foreground">Monitor project progress, budgets, and impact metrics</p>
            </div>
            {currentRole === 'admin' as any && (
              <Button className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Create Project</span>
              </Button>
            )}
          </div>
        </div>

        {/* Impact Visualization */}
        <div className="mb-8">
          <ImpactVisualization />
        </div>

        {/* Budget Management and Anomaly Detection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <BudgetManagement />
          <AnomalyDetection />
        </div>

        {/* Projects List */}
        <Card className="shadow-sm" data-testid="card-projects-list">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Projects</span>
              <div className="flex items-center space-x-2">
                  <Button variant="default" size="sm" data-testid="button-add-project">
                    <Building2 className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-projects"
                  />
                </div>
              </div>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-department-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                    {departments?.map((dept: Department) => (
                      <SelectItem key={dept.id} value={dept.id.toString()} data-testid={`option-department-${dept.id}`}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project: Project) => (
                  <Card key={project.id} className="border border-border hover:shadow-md transition-shadow" data-testid={`project-card-${project.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg" data-testid={`project-name-${project.id}`}>
                            {project.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center mt-1">
                            <Building2 className="w-4 h-4 mr-1" />
                            Department: {project.department?.name || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(project.status)}
                            data-testid={`project-status-${project.id}`}
                          >
                            <span className="mr-1">{getStatusIcon(project.status)}</span>
                            {project.status}
                          </Badge>
                          {project.verification_status && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getVerificationColor(project.verification_status)}`}
                            >
                              {project.verification_status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4" data-testid={`project-description-${project.id}`}>
                        {project.description || "No description available"}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Budget</p>
                          <p className="text-lg font-bold text-primary" data-testid={`project-budget-${project.id}`}>
                            {formatCurrency(project.budget)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Spent</p>
                          <p className="text-lg font-bold text-foreground" data-testid={`project-allocated-${project.id}`}>
                            {formatCurrency(project.spent)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{calculateProgress(project)}%</span>
                        </div>
                        <Progress value={calculateProgress(project)} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>
                            {project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN') : 'No start date'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{project.expected_beneficiaries || 0} beneficiaries</span>
                        </div>
                      </div>

                      {project.impact_score !== null && project.impact_score !== undefined && (
                        <div className="flex items-center justify-between p-2 bg-accent/10 rounded-lg mb-4">
                          <span className="text-sm font-medium">Impact Score</span>
                          <Badge variant="secondary" className="bg-accent text-accent-foreground">
                            {project.impact_score}/100
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid={`button-view-project-${project.id}`}
                            onClick={() => {
                              // For now, just show an alert. In a real app, this would navigate to a detail page
                              alert(`Viewing project: ${project.name} (ID: ${project.id})`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Link href={`/documents?projectId=${project.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-documents-${project.id}`}>
                              <FileText className="w-4 h-4 mr-1" />
                              Docs
                            </Button>
                          </Link>
                        </div>
                        <Link href={`/analytics?projectId=${project.id}`}>
                          <Button variant="outline" size="sm" data-testid={`button-analytics-${project.id}`}>
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Analytics
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Projects Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || departmentFilter !== "all" || statusFilter !== "all" 
                      ? "No projects match your current filters." 
                      : "No projects have been created yet."
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            {filteredProjects.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {filteredProjects.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-verified">
                    {filteredProjects.filter((p: Project) => p.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {filteredProjects.filter((p: Project) => p.status === 'approved').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(filteredProjects.reduce((sum: number, p: Project) => sum + p.budget, 0))}
          </div>
          <div className="text-sm text-muted-foreground">Total Budget</div>
        </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
