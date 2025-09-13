import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, History, Plus, Edit, Eye, AlertTriangle } from 'lucide-react';
import { coreAPI, budgetVersionAPI } from '@/lib/api';
import type { Project, BudgetVersion } from '@/lib/types';
import { toast } from 'sonner';

interface BudgetManagementProps {
  projectId?: string;
  onBudgetChange?: (project: Project) => void;
}

export function BudgetManagement({ projectId, onBudgetChange }: BudgetManagementProps) {
  const [isCreateVersionDialogOpen, setIsCreateVersionDialogOpen] = useState(false);
  const [isEditBudgetDialogOpen, setIsEditBudgetDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [changeReason, setChangeReason] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  // Fetch budget versions
  const { data: budgetVersions, isLoading: isLoadingVersions } = useQuery({
    queryKey: ['budget-versions', projectId],
    queryFn: async () => {
      const response = await budgetVersionAPI.getBudgetVersions();
      return response.data.results;
    },
  });

  // Create budget version mutation
  const createVersionMutation = useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: any }) => 
      budgetVersionAPI.createBudgetVersion(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-versions'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateVersionDialogOpen(false);
      setNewBudgetAmount('');
      setChangeReason('');
      toast.success('Budget version created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create budget version');
    },
  });

  // Update project budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      coreAPI.updateProject(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditBudgetDialogOpen(false);
      onBudgetChange?.(response.data);
      toast.success('Budget updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update budget');
    },
  });

  const handleCreateVersion = () => {
    if (selectedProject && newBudgetAmount && changeReason) {
      createVersionMutation.mutate({
        projectId: parseInt(selectedProject.id),
        data: {
          budget_amount: parseFloat(newBudgetAmount),
          change_reason: changeReason,
        },
      });
    }
  };

  const handleUpdateBudget = () => {
    if (selectedProject && newBudgetAmount) {
      updateBudgetMutation.mutate({
        id: parseInt(selectedProject.id),
        data: {
          budget: parseFloat(newBudgetAmount),
        },
      });
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBudgetStatus = (project: Project) => {
    const budget = Number(project.budget) || 0;
    const spent = Number(project.spent) || 0;
    const utilizationPercentage = budget > 0 ? (spent / budget) * 100 : 0;
    if (utilizationPercentage >= 100) return { status: 'over-budget', color: 'text-red-600' };
    if (utilizationPercentage >= 80) return { status: 'near-limit', color: 'text-orange-600' };
    if (utilizationPercentage >= 50) return { status: 'moderate', color: 'text-yellow-600' };
    return { status: 'healthy', color: 'text-green-600' };
  };

  const filteredProjects = projectId 
    ? projects?.filter((p: Project) => p.id === projectId)
    : projects;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5" />
          <span>Budget Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="versions">Version History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Budget Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Total Budget</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {formatCurrency(projects?.reduce((sum: number, p: Project) => sum + (Number(p.budget) || 0), 0) || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Total Spent</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {formatCurrency(projects?.reduce((sum: number, p: Project) => sum + (Number(p.spent) || 0), 0) || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">Remaining</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {formatCurrency(
                      (projects?.reduce((sum: number, p: Project) => sum + (Number(p.budget) || 0), 0) || 0) - 
                      (projects?.reduce((sum: number, p: Project) => sum + (Number(p.spent) || 0), 0) || 0)
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budget Health Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects?.slice(0, 5).map((project: Project) => {
                    const budget = Number(project.budget) || 0;
                    const spent = Number(project.spent) || 0;
                    const utilizationPercentage = budget > 0 ? (spent / budget) * 100 : 0;
                    const budgetStatus = getBudgetStatus(project);
                    
                    return (
                      <div key={project.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{project.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                            </span>
                            <Badge className={budgetStatus.color}>
                              {utilizationPercentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={utilizationPercentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Project Budgets</h3>
              <Dialog open={isEditBudgetDialogOpen} onOpenChange={setIsEditBudgetDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Budget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Project Budget</DialogTitle>

                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="project-select">Select Project</Label>
                      <Select onValueChange={(value) => {
                        const project = projects?.find((p: Project) => p.id === value);
                        setSelectedProject(project || null);
                        setNewBudgetAmount(project?.budget.toString() || '');
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects?.map((project: Project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="new-budget">New Budget Amount (₹)</Label>
                      <Input
                        id="new-budget"
                        type="number"
                        value={newBudgetAmount}
                        onChange={(e) => setNewBudgetAmount(e.target.value)}
                        placeholder="Enter new budget amount"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditBudgetDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateBudget}
                        disabled={!selectedProject || !newBudgetAmount || updateBudgetMutation.isPending}
                      >
                        {updateBudgetMutation.isPending ? 'Updating...' : 'Update Budget'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {isLoadingProjects ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredProjects?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No projects found.</p>
                </div>
              ) : (
                filteredProjects?.map((project: Project) => {
                  const budget = Number(project.budget) || 0;
                  const spent = Number(project.spent) || 0;
                  const utilizationPercentage = budget > 0 ? (spent / budget) * 100 : 0;
                  const budgetStatus = getBudgetStatus(project);
                  
                  return (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{project.name}</h4>
                              <Badge variant="outline">{project.status}</Badge>
                              <Badge className={budgetStatus.color}>
                                {budgetStatus.status.replace('-', ' ')}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {project.description}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>Budget: {formatCurrency(project.budget)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>Spent: {formatCurrency(project.spent)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <TrendingDown className="w-4 h-4" />
                                <span>Remaining: {formatCurrency(budget - spent)}</span>
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Utilization</span>
                                <span>{utilizationPercentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={utilizationPercentage} className="h-2" />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProject(project);
                                setIsCreateVersionDialogOpen(true);
                              }}
                            >
                              <History className="w-4 h-4 mr-1" />
                              Create Version
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="versions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Budget Version History</h3>
              <Dialog open={isCreateVersionDialogOpen} onOpenChange={setIsCreateVersionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Version
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Budget Version</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="version-project-select">Select Project</Label>
                      <Select onValueChange={(value) => {
                        const project = projects?.find((p: Project) => p.id === value);
                        setSelectedProject(project || null);
                        setNewBudgetAmount(project?.budget.toString() || '');
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects?.map((project: Project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="version-budget-amount">Budget Amount (₹)</Label>
                      <Input
                        id="version-budget-amount"
                        type="number"
                        value={newBudgetAmount}
                        onChange={(e) => setNewBudgetAmount(e.target.value)}
                        placeholder="Enter budget amount"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="change-reason">Change Reason</Label>
                      <Textarea
                        id="change-reason"
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                        placeholder="Describe the reason for this budget change..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateVersionDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateVersion}
                        disabled={!selectedProject || !newBudgetAmount || !changeReason || createVersionMutation.isPending}
                      >
                        {createVersionMutation.isPending ? 'Creating...' : 'Create Version'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {isLoadingVersions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : budgetVersions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No budget versions found.</p>
                </div>
              ) : (
                budgetVersions?.map((version: BudgetVersion) => (
                  <Card key={version.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{version.project_name}</h4>
                            <Badge variant="outline">v{version.version_number}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {version.change_reason}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatCurrency(version.budget_amount)}</span>
                            </span>
                            <span className="text-muted-foreground">
                              by {version.changed_by_name}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(version.changed_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
