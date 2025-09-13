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
import { useRole } from "@/hooks/useRole";
import { Search, Filter, Download, Eye, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface FundFlow {
  id: string;
  fromEntity: string;
  toEntity: string;
  amount: number;
  purpose?: string;
  status: string;
  createdAt?: string;
  transactionHash?: string;
  verificationStatus?: string;
}

interface Project {
  id: string;
  name: string;
}

export default function FundFlows() {
  const { currentRole } = useRole();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: fundFlows, isLoading: flowsLoading, error } = useQuery({
    queryKey: ["/api/fund-flows", selectedProject === "all" ? undefined : selectedProject],
  });

  const filteredFlows = fundFlows?.filter((flow: FundFlow) => {
    const matchesStatus = statusFilter === "all" || flow.status === statusFilter;
    const matchesSearch = !searchQuery || 
      flow.fromEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.toEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.purpose?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "cancelled": return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-verified";
      case "pending": return "text-warning";
      case "cancelled": return "text-anomaly";
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

  return (
    <main className="min-h-screen bg-background" data-testid="page-fund-flows">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">Fund Flows</h1>
          <p className="text-muted-foreground">Track and visualize how funds move through your institution</p>
        </div>

        {/* Interactive Fund Flow Diagram */}
        <div className="mb-8">
          <FundFlowDiagram />
        </div>

        {/* Timeline Tracking */}
        <div className="mb-8">
          <TimelineTracking />
        </div>

        {/* Fund Flow List */}
        <Card className="shadow-sm" data-testid="card-fund-flow-list">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fund Flow Transactions</span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" data-testid="button-export">
                  <Download className="w-4 h-4 mr-2" />
                  Export
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
                    placeholder="Search fund flows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-flows"
                  />
                </div>
              </div>
              
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[200px]" data-testid="select-project-filter">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map((project: Project) => (
                    <SelectItem key={project.id} value={project.id} data-testid={`option-project-${project.id}`}>
                      {project.name}
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
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getStatusIcon(flow.status)}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {flow.fromEntity} → {flow.toEntity}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {flow.purpose || "No purpose specified"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
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
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span data-testid={`flow-date-${flow.id}`}>
                          {flow.createdAt ? new Date(flow.createdAt).toLocaleDateString('en-IN') : 'No date'}
                        </span>
                        {flow.transactionHash && (
                          <Badge variant="secondary" className="text-xs">
                            Blockchain: {flow.transactionHash.slice(0, 8)}...
                          </Badge>
                        )}
                        {flow.verificationStatus && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${flow.verificationStatus === 'verified' ? 'text-verified border-verified' : 
                              flow.verificationStatus === 'under_review' ? 'text-warning border-warning' : 
                              'text-anomaly border-anomaly'}`}
                          >
                            {flow.verificationStatus.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`button-view-flow-${flow.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
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
