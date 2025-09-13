import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MessageSquare, Plus, Reply, Flag, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { communityFeedbackAPI } from '@/lib/api';
import type { CommunityFeedback } from '@/lib/types';
import { toast } from 'sonner';

interface CommunityFeedbackProps {
  projectId?: string;
  departmentId?: string;
  fundFlowId?: string;
}

export function CommunityFeedbackComponent({ projectId, departmentId, fundFlowId }: CommunityFeedbackProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<CommunityFeedback | null>(null);
  const [responseText, setResponseText] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch feedback
  const { data: feedback, isLoading, error } = useQuery({
    queryKey: ['community-feedback', projectId, departmentId, fundFlowId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('project', projectId);
      if (departmentId) params.append('department', departmentId);
      if (fundFlowId) params.append('fund_flow', fundFlowId);
      
      console.log('Fetching feedback with params:', params.toString());
      const response = await communityFeedbackAPI.getFeedback(params.toString());
      console.log('Feedback response:', response);
      return response.data.results || response.data;
    },
  });

  // Log errors
  if (error) {
    console.error('Error fetching feedback:', error);
  }

  // Create feedback mutation
  const createFeedbackMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('Submitting feedback data:', data);
      return communityFeedbackAPI.createFeedback(data);
    },
    onSuccess: (response) => {
      console.log('Feedback created successfully:', response);
      queryClient.invalidateQueries({ queryKey: ['community-feedback'] });
      setIsCreateDialogOpen(false);
      toast.success('Feedback submitted successfully');
    },
    onError: (error: any) => {
      console.error('Error creating feedback:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to submit feedback';
      toast.error(errorMessage);
    },
  });

  // Respond to feedback mutation
  const respondToFeedbackMutation = useMutation({
    mutationFn: ({ id, response }: { id: number; response: string }) => 
      communityFeedbackAPI.respondToFeedback(id, { response }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feedback'] });
      setIsRespondDialogOpen(false);
      setResponseText('');
      toast.success('Response added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add response');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      communityFeedbackAPI.updateFeedbackStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feedback'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });

  const handleCreateFeedback = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Get the selected project/department/fund_flow from the form if not provided as props
    const selectedProject = formData.get('selected_project') || projectId;
    const selectedDepartment = formData.get('selected_department') || departmentId;
    const selectedFundFlow = formData.get('selected_fund_flow') || fundFlowId;
    
    const data = {
      project: selectedProject || null,
      department: selectedDepartment || null,
      fund_flow: selectedFundFlow || null,
      feedback_type: formData.get('feedback_type'),
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      is_public: formData.get('is_public') === 'on',
      is_anonymous: formData.get('is_anonymous') === 'on',
    };
    
    // Validate that at least one target is specified
    if (!selectedProject && !selectedDepartment && !selectedFundFlow) {
      toast.error('Please specify a project, department, or fund flow context');
      return;
    }
    
    // Convert string IDs to numbers if they exist
    const processedData = {
      ...data,
      project: selectedProject ? parseInt(selectedProject as string) : null,
      department: selectedDepartment ? parseInt(selectedDepartment as string) : null,
      fund_flow: selectedFundFlow ? parseInt(selectedFundFlow as string) : null,
    };
    
    createFeedbackMutation.mutate(processedData);
  };

  const handleRespond = () => {
    if (selectedFeedback && responseText.trim()) {
      respondToFeedbackMutation.mutate({
        id: parseInt(selectedFeedback.id),
        response: responseText.trim(),
      });
    }
  };

  const handleStatusUpdate = (feedbackId: string, newStatus: string) => {
    updateStatusMutation.mutate({
      id: parseInt(feedbackId),
      status: newStatus,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'under_review':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'responded':
        return <Reply className="w-4 h-4 text-green-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed':
        return <Flag className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Community Feedback</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
            <MessageSquare className="w-5 h-5" />
            <span>Community Feedback</span>
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit Community Feedback</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFeedback} className="space-y-4">
                {/* Context Selection - only show if no context is provided via props */}
                {!projectId && !departmentId && !fundFlowId && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-medium mb-2 block">Select Context (Required)</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label htmlFor="selected_project" className="text-xs">Project</Label>
                        <Input 
                          name="selected_project" 
                          placeholder="Enter project ID or leave empty"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="selected_department" className="text-xs">Department</Label>
                        <Input 
                          name="selected_department" 
                          placeholder="Enter department ID or leave empty"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="selected_fund_flow" className="text-xs">Fund Flow</Label>
                        <Input 
                          name="selected_fund_flow" 
                          placeholder="Enter fund flow ID or leave empty"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      At least one context must be specified
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="feedback_type">Type</Label>
                    <Select name="feedback_type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="suggestion">Suggestion</SelectItem>
                        <SelectItem value="concern">Concern</SelectItem>
                        <SelectItem value="complaint">Complaint</SelectItem>
                        <SelectItem value="praise">Praise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input name="title" placeholder="Brief title for your feedback" required />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    name="description" 
                    placeholder="Detailed description of your feedback"
                    rows={4}
                    required 
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" name="is_public" id="is_public" defaultChecked />
                    <Label htmlFor="is_public">Make public</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" name="is_anonymous" id="is_anonymous" />
                    <Label htmlFor="is_anonymous">Submit anonymously</Label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFeedbackMutation.isPending}>
                    {createFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!feedback || (Array.isArray(feedback) && feedback.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No feedback yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            Array.isArray(feedback) && feedback.map((item: CommunityFeedback) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{item.title}</h4>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(item.status)}
                        <span className="text-sm text-muted-foreground capitalize">
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      by {item.is_anonymous ? 'Anonymous' : item.user_name} • {item.feedback_type}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.status === 'pending' && (
                      <Dialog open={isRespondDialogOpen} onOpenChange={setIsRespondDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedFeedback(item)}
                          >
                            <Reply className="w-4 h-4 mr-2" />
                            Respond
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Respond to Feedback</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Original Feedback</Label>
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            </div>
                            <div>
                              <Label htmlFor="response">Your Response</Label>
                              <Textarea
                                id="response"
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Type your response here..."
                                rows={4}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsRespondDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleRespond}
                                disabled={!responseText.trim() || respondToFeedbackMutation.isPending}
                              >
                                {respondToFeedbackMutation.isPending ? 'Responding...' : 'Send Response'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Select
                      value={item.status}
                      onValueChange={(value) => handleStatusUpdate(item.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="responded">Responded</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <p className="text-sm">{item.description}</p>
                
                {item.response && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Reply className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Response</span>
                      {item.responded_by_name && (
                        <span className="text-xs text-muted-foreground">
                          by {item.responded_by_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{item.response}</p>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
