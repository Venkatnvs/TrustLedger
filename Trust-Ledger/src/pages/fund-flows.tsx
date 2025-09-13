import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { FundFlowDiagram } from "@/components/FundFlowDiagram";
import { TimelineTracking } from "@/components/TimelineTracking";
import { CommunityFeedbackComponent } from "@/components/CommunityFeedback";
import { FundFlowCreationModal } from "@/components/FundFlowCreationModal";
import { BudgetSpendingTracker } from "@/components/BudgetSpendingTracker";
import { FundFlowActions } from "@/components/FundFlowActions";
import { FundFlowAnalytics } from "@/components/FundFlowAnalytics";
import { useRole } from "@/hooks/useRole";
import { Search, Filter, Download, Eye, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { coreAPI, fundFlowsAPI } from "@/lib/api";

interface FundFlow {
  id: number;
  source_name: string;
  target_name: string;
  amount: number;
  status: 'verified' | 'under_review' | 'anomaly';
  transaction_date: string;
  created_at: string;
  description?: string;
}

interface Project {
  id: number;
  name: string;
}

export default function FundFlows() {
  const { currentRole } = useRole();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  const { data: fundFlows, isLoading: flowsLoading, error } = useQuery({
    queryKey: ["fund-flows", selectedProject === "all" ? undefined : selectedProject],
    queryFn: async () => {
      const response = await fundFlowsAPI.getFundFlows();
      console.log('Fund flows API response:', response.data);
      return response.data.results || [];
    },
  });

  const filteredFlows = fundFlows?.filter((flow: FundFlow) => {
    const targetName = flow.target_name || 'Unknown';
    const sourceName = flow.source_name || 'Unknown Source';
    
    const matchesStatus = statusFilter === "all" || flow.status === statusFilter;
    const matchesSearch = !searchQuery || 
      sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      targetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === "all" || 
      flow.target_name?.includes(selectedProject);
    return matchesStatus && matchesSearch && matchesProject;
  }) || [];

  console.log('Fund flows data:', fundFlows);
  console.log('Filtered flows:', filteredFlows);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle className="w-4 h-4" />;
      case "under_review": return <Clock className="w-4 h-4" />;
      case "anomaly": return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "text-verified";
      case "under_review": return "text-warning";
      case "anomaly": return "text-anomaly";
      default: return "text-muted-foreground";
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Fund Flows</h2>
          <p className="text-muted-foreground">Unable to fetch fund flow data. Please try again.</p>
        </div>
      </div>
    );
  }

  if (flowsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Fund Flows</h2>
          <p className="text-muted-foreground">Please wait while we fetch the data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-x-hidden" data-testid="page-fund-flows">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">Fund Flows</h1>
              <p className="text-muted-foreground">Track and visualize how funds move through your institution</p>
            </div>
            <FundFlowCreationModal />
          </div>
        </div>

        {/* Budget Spending Tracker */}
        <div className="mb-8">
          <BudgetSpendingTracker />
        </div>

        {/* Interactive Fund Flow Diagram */}
        <div className="mb-8">
          <FundFlowDiagram />
        </div>

        {/* Timeline Tracking */}
        <div className="mb-8">
          <TimelineTracking />
        </div>

        {/* Fund Flow Analytics */}
        <div className="mb-8">
          <FundFlowAnalytics />
        </div>

        {/* Community Feedback */}
        <div className="mb-8">
          <CommunityFeedbackComponent />
        </div>

        {/* Fund Flow List */}
        <Card className="shadow-sm" data-testid="card-fund-flow-list">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fund Flow Transactions</span>
              <div className="flex items-center space-x-2">
                <FundFlowCreationModal />
                <Button variant="outline" size="sm" data-testid="button-export">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search fund flows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                  data-testid="input-search-flows"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-full" data-testid="select-project-filter">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects?.map((project: Project) => (
                      <SelectItem key={project.id} value={project.id.toString()} data-testid={`option-project-${project.id}`}>
                        {project.name.length > 30 ? `${project.name.slice(0, 30)}...` : project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="anomaly">Anomaly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fund Flow List */}
            <div className="space-y-4">
              {flowsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="space-y-1">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))
              ) : filteredFlows.length > 0 ? (
                filteredFlows.map((flow: FundFlow) => (
                  <div key={flow.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors" data-testid={`flow-item-${flow.id}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getStatusIcon(flow.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-foreground truncate">
                            {flow.source_name || 'Unknown Source'} → {flow.target_name || 'Unknown'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Transaction ID: {flow.id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-primary" data-testid={`flow-amount-${flow.id}`}>
                          ₹{parseFloat(flow.amount.toString()).toLocaleString('en-IN')}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(flow.status)} border-current`}
                          data-testid={`flow-status-${flow.id}`}
                        >
                          {flow.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <span data-testid={`flow-date-${flow.id}`}>
                          {flow.transaction_date ? new Date(flow.transaction_date).toLocaleDateString('en-IN') : 'No date'}
                        </span>
                        <Badge variant="secondary" className="text-xs w-fit">
                          Created: {new Date(flow.created_at).toLocaleDateString('en-IN')}
                        </Badge>
                      </div>
                      <div className="flex-shrink-0">
                        <FundFlowActions fundFlow={flow} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Fund Flows Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || selectedProject !== "all" 
                      ? "No fund flows match your current filters." 
                      : "No fund flows have been recorded yet."
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredFlows.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredFlows.length} fund flow{filteredFlows.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled data-testid="button-previous-page">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled data-testid="button-next-page">
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
