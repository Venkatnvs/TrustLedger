import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Timeline, TimelineItem, TimelineContent, TimelineSeparator, TimelineDot, TimelineConnector } from '@/components/ui/timeline';
import { 
  DollarSign, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Building2,
  Calendar,
  User,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { coreAPI, fundFlowsAPI, fundAllocationAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';

interface Project {
  id: number;
  name: string;
  budget: number;
  spent: number;
  remaining_budget: number;
  department_name?: string;
  created_at: string;
  updated_at: string;
}

interface FundAllocation {
  id: number;
  project_id: number;
  amount: number;
  allocation_type: 'initial' | 'additional' | 'adjustment' | 'reallocation';
  source: string;
  description: string;
  allocated_by: {
    id: number;
    username: string;
  };
  approved_by?: {
    id: number;
    username: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'active';
  allocation_date: string;
  effective_date: string;
  created_at: string;
  updated_at: string;
  supporting_documents?: string;
  notes?: string;
}

interface FundAllocationTimelineProps {
  project: Project;
  onAllocationAdded?: () => void;
}

export function FundAllocationTimeline({ project, onAllocationAdded }: FundAllocationTimelineProps) {
  // Fetch fund allocations for this project
  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ['fund-allocations', project.id],
    queryFn: async () => {
      const response = await fundAllocationAPI.getFundAllocations(project.id);
      return response.data.results || [];
    },
  });

  // Add new allocation mutation
  const addAllocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fundAllocationAPI.createFundAllocation({
        ...data,
        project: project.id,
      });
      return response;
    },
    onSuccess: () => {
      onAllocationAdded?.();
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4" />;
      case 'active': return <TrendingUp className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-verified bg-verified/10 border-verified';
      case 'pending': return 'text-warning bg-warning/10 border-warning';
      case 'rejected': return 'text-anomaly bg-anomaly/10 border-anomaly';
      case 'active': return 'text-primary bg-primary/10 border-primary';
      default: return 'text-muted-foreground bg-muted/10 border-muted';
    }
  };

  const getAllocationTypeColor = (type: string) => {
    switch (type) {
      case 'initial': return 'text-primary bg-primary/10';
      case 'additional': return 'text-verified bg-verified/10';
      case 'adjustment': return 'text-warning bg-warning/10';
      case 'reallocation': return 'text-accent bg-accent/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const getAllocationTypeIcon = (type: string) => {
    switch (type) {
      case 'initial': return <Building2 className="w-4 h-4" />;
      case 'additional': return <Plus className="w-4 h-4" />;
      case 'adjustment': return <TrendingUp className="w-4 h-4" />;
      case 'reallocation': return <TrendingDown className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const totalAllocated = allocations?.reduce((sum: number, alloc: FundAllocation) => sum + Number(alloc.amount), 0) || 0;
  const approvedAllocations = allocations?.filter((a: FundAllocation) => a.status === 'approved').reduce((sum: number, alloc: FundAllocation) => sum + alloc.amount, 0) || 0;
  const pendingAllocations = allocations?.filter((a: FundAllocation) => a.status === 'pending').reduce((sum: number, alloc: FundAllocation) => sum + alloc.amount, 0) || 0;

  if (allocationsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fund Allocation Timeline</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Fund Allocation Timeline</span>
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Allocation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Allocation Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{formatCurrency(totalAllocated)}</div>
            <div className="text-xs text-muted-foreground">Total Allocated</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-verified">{formatCurrency(Number(approvedAllocations))}</div>
            <div className="text-xs text-muted-foreground">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-warning">{formatCurrency(Number(pendingAllocations))}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {allocations && allocations.length > 0 ? (
            allocations
              .sort((a: FundAllocation, b: FundAllocation) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((allocation: FundAllocation, index: number) => (
                <div key={allocation.id} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${getAllocationTypeColor(allocation.allocation_type)}`}>
                      {getAllocationTypeIcon(allocation.allocation_type)}
                    </div>
                    {index < allocations.length - 1 && (
                      <div className="w-0.5 h-8 bg-border mt-2"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(allocation.status)}>
                          <span className="mr-1">{getStatusIcon(allocation.status)}</span>
                          {allocation.status}
                        </Badge>
                        <Badge variant="outline" className={getAllocationTypeColor(allocation.allocation_type)}>
                          {allocation.allocation_type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {formatCurrency(Number(allocation.amount))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(allocation.allocation_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{allocation.description}</h4>
                      <p className="text-sm text-muted-foreground">
                        Source: {allocation.source}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            Allocated by: {allocation.allocated_by.username}
                          </span>
                          {allocation.approved_by && (
                            <span className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved by: {allocation.approved_by.username}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3" />
                          <span>Effective: {new Date(allocation.effective_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {allocation.supporting_documents && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <FileText className="w-3 h-3 mr-1" />
                          <span>Documents: {allocation.supporting_documents}</span>
                        </div>
                      )}
                      
                      {allocation.notes && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          <strong>Notes:</strong> {allocation.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No fund allocations found</p>
              <p className="text-xs">Fund allocations will appear here when added</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
