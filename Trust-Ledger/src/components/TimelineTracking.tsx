import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Eye,
  DollarSign
} from "lucide-react";

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

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  amount?: number;
  status: 'completed' | 'in_progress' | 'pending' | 'anomaly';
  type: 'approval' | 'release' | 'milestone' | 'anomaly' | 'completion';
  documents?: string[];
}

export function TimelineTracking() {
  const [selectedProject, setSelectedProject] = useState<string>("all");

  // Mock data for now - replace with actual API calls
  const projects = [
    { id: "1", name: "Education Initiative" },
    { id: "2", name: "Healthcare Program" },
    { id: "3", name: "Infrastructure Project" }
  ];
  const projectsLoading = false;

  const fundFlows = [
    {
      id: "1",
      fromEntity: "Central Government",
      toEntity: "Education Department",
      amount: 5000000,
      purpose: "School Infrastructure",
      status: "completed",
      createdAt: "2024-01-15T10:00:00Z",
      transactionHash: "0x1234567890abcdef"
    },
    {
      id: "2",
      fromEntity: "State Government",
      toEntity: "Healthcare Department",
      amount: 3000000,
      purpose: "Medical Equipment",
      status: "in_progress",
      createdAt: "2024-01-20T14:30:00Z"
    }
  ];
  const flowsLoading = false;

  const anomalies = [];

  // Convert fund flows and other data into timeline events
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    if (fundFlows) {
      fundFlows.forEach((flow: FundFlow) => {
        events.push({
          id: flow.id,
          title: `${flow.status === 'approved' ? 'Budget Approved' : 'Fund Flow ' + flow.status}`,
          description: `${flow.fromEntity} → ${flow.toEntity}: ${flow.purpose || 'No description'}`,
          date: flow.createdAt ? new Date(flow.createdAt).toISOString() : new Date().toISOString(),
          amount: parseFloat(flow.amount.toString()),
          status: flow.status as any,
          type: flow.status === 'approved' ? 'approval' : 'release',
          documents: flow.transactionHash ? [`Transaction Hash: ${flow.transactionHash}`] : undefined
        });
      });
    }

    if (anomalies) {
      anomalies.forEach((anomaly: any) => {
        events.push({
          id: anomaly.id,
          title: 'Anomaly Detected',
          description: anomaly.description,
          date: anomaly.createdAt ? new Date(anomaly.createdAt).toISOString() : new Date().toISOString(),
          status: 'anomaly',
          type: 'anomaly'
        });
      });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const timelineEvents = generateTimelineEvents();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-verified border-4 border-background';
      case 'approved': return 'bg-verified border-4 border-background';
      case 'in_progress': return 'bg-primary border-4 border-background';
      case 'pending': return 'bg-muted border-4 border-background';
      case 'anomaly': return 'bg-warning border-4 border-background';
      default: return 'bg-muted border-4 border-background';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'approved': return 'text-verified';
      case 'in_progress': return 'text-primary';
      case 'pending': return 'text-muted-foreground';
      case 'anomaly': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="shadow-sm" data-testid="card-timeline-tracking">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fund Allocation Timeline</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Last updated: 2 hours ago</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Project Filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[280px]" data-testid="select-project-timeline">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects Timeline</SelectItem>
                {projects?.map((project: Project) => (
                  <SelectItem key={project.id} value={project.id} data-testid={`option-timeline-project-${project.id}`}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" data-testid="button-export-timeline">
            <FileText className="w-4 h-4 mr-2" />
            Export Timeline
          </Button>
        </div>

        {/* Timeline */}
        <div className="relative" data-testid="timeline-container">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>

          {/* Timeline Events */}
          <div className="space-y-8">
            {flowsLoading || projectsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="relative flex items-start">
                  <Skeleton className="absolute left-6 w-4 h-4 rounded-full" />
                  <div className="ml-16 bg-background border border-border rounded-lg p-4 shadow-sm w-full">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full mb-3" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : timelineEvents.length > 0 ? (
              timelineEvents.map((event) => (
                <div key={event.id} className="relative flex items-start" data-testid={`timeline-event-${event.id}`}>
                  <div className={`absolute left-6 w-4 h-4 ${getStatusColor(event.status)} rounded-full shadow-sm z-10`}>
                    <div className={`w-full h-full flex items-center justify-center ${getStatusTextColor(event.status)}`}>
                      {/* Icon would be smaller than 4x4, so we use a dot */}
                      <div className="w-2 h-2 bg-current rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-16 bg-background border border-border rounded-lg p-4 shadow-sm w-full hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground" data-testid={`event-title-${event.id}`}>
                        {event.title}
                      </h4>
                      <span className="text-xs text-muted-foreground" data-testid={`event-date-${event.id}`}>
                        {new Date(event.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3" data-testid={`event-description-${event.id}`}>
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {event.amount && (
                          <span className="text-sm font-medium text-primary flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ₹{event.amount.toLocaleString('en-IN')}
                          </span>
                        )}
                        <div className="flex items-center text-xs">
                          <span className="mr-2">{getStatusIcon(event.status)}</span>
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${getStatusTextColor(event.status)} border-current`}
                          >
                            {event.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {event.documents && event.documents.length > 0 && (
                          <Button variant="ghost" size="sm" data-testid={`button-view-documents-${event.id}`}>
                            <FileText className="w-4 h-4 mr-1" />
                            Documents
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" data-testid={`button-view-details-${event.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                    
                    {/* Show transaction hash or additional info */}
                    {event.documents && event.documents.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <FileText className="w-3 h-3 mr-1" />
                          {event.documents.map((doc, i) => (
                            <span key={i} className="mr-2 font-mono bg-muted px-2 py-1 rounded">
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Timeline Events</h3>
                <p className="text-muted-foreground">
                  {selectedProject === "all" 
                    ? "No fund flow events have been recorded yet."
                    : "No events found for the selected project."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Summary */}
        {timelineEvents.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">
                {timelineEvents.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-verified">
                {timelineEvents.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-warning">
                {timelineEvents.filter(e => e.status === 'anomaly').length}
              </div>
              <div className="text-sm text-muted-foreground">Anomalies</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">
                ₹{timelineEvents
                  .filter(e => e.amount)
                  .reduce((sum, e) => sum + (e.amount || 0), 0)
                  .toLocaleString('en-IN')
                }
              </div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
