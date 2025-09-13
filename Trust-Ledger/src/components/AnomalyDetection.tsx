import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertTriangle, CheckCircle, Clock, Eye, Filter, RefreshCw, X } from 'lucide-react';
import { fundFlowsAPI } from '@/lib/api';
import type { Anomaly } from '@/lib/types';
import { toast } from 'sonner';

interface AnomalyDetectionProps {
  onAnomalySelect?: (anomaly: Anomaly) => void;
}

export function AnomalyDetection({ onAnomalySelect }: AnomalyDetectionProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch anomalies
  const { data: anomalies, isLoading } = useQuery({
    queryKey: ['anomalies', selectedSeverity, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity);
      if (selectedStatus !== 'all') params.append('resolved', selectedStatus === 'resolved' ? 'true' : 'false');
      
      const response = await fundFlowsAPI.getAnomalies();
      return response.data.results;
    },
  });

  // Fetch anomaly count
  const { data: anomalyCount } = useQuery({
    queryKey: ['anomaly-count'],
    queryFn: async () => {
      const response = await fundFlowsAPI.getAnomaliesCount();
      return response.data;
    },
  });

  // Resolve anomaly mutation
  const resolveAnomalyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      fundFlowsAPI.resolveAnomaly(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['anomaly-count'] });
      setIsResolveDialogOpen(false);
      setResolutionNotes('');
      toast.success('Anomaly resolved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to resolve anomaly');
    },
  });

  // Run anomaly detection mutation
  const runDetectionMutation = useMutation({
    mutationFn: async () => {
      // This would call the backend to run anomaly detection
      const response = await fetch('/api/core/run-anomaly-detection/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['anomaly-count'] });
      toast.success('Anomaly detection completed');
    },
    onError: (error: any) => {
      toast.error('Failed to run anomaly detection');
    },
  });

  const handleResolveAnomaly = () => {
    if (selectedAnomaly && resolutionNotes.trim()) {
      resolveAnomalyMutation.mutate({
        id: parseInt(selectedAnomaly.id),
        data: {
          resolved: true,
          resolution_notes: resolutionNotes.trim(),
        },
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAnomalies = anomalies?.filter((anomaly: Anomaly) => {
    if (selectedSeverity !== 'all' && anomaly.severity !== selectedSeverity) return false;
    if (selectedStatus === 'resolved' && !anomaly.resolved) return false;
    if (selectedStatus === 'unresolved' && anomaly.resolved) return false;
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Anomaly Detection</span>
            {anomalyCount && (
              <Badge variant="destructive">
                {anomalyCount.unresolved_anomalies} unresolved
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runDetectionMutation.mutate()}
              disabled={runDetectionMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${runDetectionMutation.isPending ? 'animate-spin' : ''}`} />
              Run Detection
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="severity-filter">Severity:</Label>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="status-filter">Status:</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Anomalies List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredAnomalies?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No anomalies found matching your criteria.</p>
            </div>
          ) : (
            filteredAnomalies?.map((anomaly: Anomaly) => (
              <div
                key={anomaly.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onAnomalySelect?.(anomaly)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(anomaly.severity)}
                      <Badge className={getSeverityColor(anomaly.severity)}>
                        {anomaly.severity.toUpperCase()}
                      </Badge>
                      {anomaly.resolved ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm font-medium">{anomaly.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Detected: {formatDate(anomaly.detected_at)}</span>
                      {anomaly.resolved && anomaly.resolved_at && (
                        <span>Resolved: {formatDate(anomaly.resolved_at)}</span>
                      )}
                    </div>
                    
                    {anomaly.resolution_notes && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                        <strong>Resolution:</strong> {anomaly.resolution_notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnomalySelect?.(anomaly);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    
                    {!anomaly.resolved && (
                      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAnomaly(anomaly);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Resolve Anomaly</DialogTitle>
                            <DialogDescription>
                              Provide details about how this anomaly was resolved.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Anomaly Description</Label>
                              <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
                            </div>
                            <div>
                              <Label htmlFor="resolution-notes">Resolution Notes</Label>
                              <Textarea
                                id="resolution-notes"
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                placeholder="Describe how this anomaly was resolved..."
                                rows={4}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setIsResolveDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleResolveAnomaly}
                                disabled={!resolutionNotes.trim() || resolveAnomalyMutation.isPending}
                              >
                                {resolveAnomalyMutation.isPending ? 'Resolving...' : 'Mark as Resolved'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {anomalyCount && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {anomalyCount.unresolved_anomalies}
              </div>
              <div className="text-sm text-red-600">Unresolved</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {anomalyCount.total_anomalies - anomalyCount.unresolved_anomalies}
              </div>
              <div className="text-sm text-green-600">Resolved</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {anomalyCount.total_anomalies}
              </div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
