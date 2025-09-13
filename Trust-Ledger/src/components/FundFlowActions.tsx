import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MoreHorizontal, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Flag,
  Clock
} from 'lucide-react';
import { fundFlowsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface FundFlow {
  id: number;
  amount: string | number;
  status: string;
  transaction_date: string;
  description?: string;
  source_name: string;
  target_name: string;
  verified_by?: {
    id: number;
    username: string;
  };
  verified_at?: string;
}

interface FundFlowActionsProps {
  fundFlow: FundFlow;
  onActionComplete?: () => void;
}

export function FundFlowActions({ fundFlow, onActionComplete }: FundFlowActionsProps) {
  const [isAnomalyDialogOpen, setIsAnomalyDialogOpen] = useState(false);
  const [anomalyReason, setAnomalyReason] = useState('');
  
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: () => fundFlowsAPI.verifyFundFlow(fundFlow.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-flows'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Fund flow verified successfully!');
      onActionComplete?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to verify fund flow');
    },
  });

  const flagAnomalyMutation = useMutation({
    mutationFn: (data: { reason: string; severity: number }) => 
      fundFlowsAPI.flagAnomaly(fundFlow.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-flows'] });
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      toast.success('Anomaly flagged successfully!');
      setIsAnomalyDialogOpen(false);
      setAnomalyReason('');
      onActionComplete?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to flag anomaly');
    },
  });

  const handleVerify = () => {
    verifyMutation.mutate();
  };

  const handleFlagAnomaly = () => {
    if (!anomalyReason.trim()) {
      toast.error('Please provide a reason for flagging this anomaly');
      return;
    }
    
    flagAnomalyMutation.mutate({
      reason: anomalyReason,
      severity: 7 // Medium severity
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-verified" />;
      case 'under_review': return <Clock className="w-4 h-4 text-warning" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4 text-anomaly" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-verified bg-verified/10 border-verified';
      case 'under_review': return 'text-warning bg-warning/10 border-warning';
      case 'anomaly': return 'text-anomaly bg-anomaly/10 border-anomaly';
      default: return 'text-muted-foreground bg-muted/10 border-muted';
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Badge 
          variant="outline" 
          className={`${getStatusColor(fundFlow.status)} border-current`}
        >
          <span className="mr-1">{getStatusIcon(fundFlow.status)}</span>
          {fundFlow.status.replace('_', ' ')}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {/* View details */}}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            
            {fundFlow.status === 'under_review' && (
              <DropdownMenuItem onClick={handleVerify}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify
              </DropdownMenuItem>
            )}
            
            {fundFlow.status !== 'anomaly' && (
              <DropdownMenuItem onClick={() => setIsAnomalyDialogOpen(true)}>
                <Flag className="w-4 h-4 mr-2" />
                Flag Anomaly
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Anomaly Flagging Dialog */}
      <Dialog open={isAnomalyDialogOpen} onOpenChange={setIsAnomalyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-anomaly" />
              <span>Flag Anomaly</span>
            </DialogTitle>
            <DialogDescription>
              Report this fund flow as an anomaly with details about why it's suspicious.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Fund Flow Details</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Amount: ₹{Number(fundFlow.amount).toLocaleString()}</div>
                <div>From: {fundFlow.source_name}</div>
                <div>To: {fundFlow.target_name}</div>
                <div>Date: {new Date(fundFlow.transaction_date).toLocaleDateString()}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="anomaly-reason">Reason for Flagging *</Label>
              <Textarea
                id="anomaly-reason"
                value={anomalyReason}
                onChange={(e) => setAnomalyReason(e.target.value)}
                placeholder="Describe why this fund flow appears to be an anomaly..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAnomalyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFlagAnomaly}
                disabled={flagAnomalyMutation.isPending}
                className="bg-anomaly hover:bg-anomaly/90"
              >
                {flagAnomalyMutation.isPending ? 'Flagging...' : 'Flag Anomaly'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
