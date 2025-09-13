import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, DollarSign, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fundFlowsAPI, coreAPI } from '@/lib/api';
import { toast } from 'sonner';

interface FundFlowFormData {
  source: string;
  target_project: string;
  amount: string;
  description: string;
  transaction_date: string;
}

interface FundSource {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
  department?: {
    id: number;
    name: string;
  };
  department_name?: string;
  budget: number;
  spent: number;
  remaining_budget: number;
}

export function FundFlowCreationModal() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState<FundFlowFormData>({
    source: '',
    target_project: '',
    amount: '',
    description: '',
    transaction_date: ''
  });

  const queryClient = useQueryClient();

  // Fetch fund sources
  const { data: fundSources, isLoading: fundSourcesLoading } = useQuery({
    queryKey: ['fund-sources'],
    queryFn: async () => {
      const response = await fundFlowsAPI.getFundSources();
      return response.data.results;
    },
  });

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  // Create fund flow mutation
  const createFundFlowMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fundFlowsAPI.createFundFlow(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-flows'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Fund flow created successfully!');
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create fund flow');
    },
  });

  const resetForm = () => {
    setFormData({
      source: '',
      target_project: '',
      amount: '',
      description: '',
      transaction_date: ''
    });
    setDate(undefined);
  };

  const handleInputChange = (field: keyof FundFlowFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.source || !formData.target_project || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedProject = projects?.find((p: Project) => p.id.toString() === formData.target_project);
    if (selectedProject && parseFloat(formData.amount) > Number(selectedProject.remaining_budget)) {
      toast.error(`Amount exceeds remaining budget (₹${Number(selectedProject.remaining_budget).toLocaleString()})`);
      return;
    }

    const submitData = {
      source: parseInt(formData.source),
      target_project: parseInt(formData.target_project),
      amount: parseFloat(formData.amount),
      description: formData.description,
      transaction_date: date ? format(date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
      status: 'under_review'
    };

    createFundFlowMutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Fund Flow</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Create New Fund Flow</span>
          </DialogTitle>
          <DialogDescription>
            Record a new fund transfer between sources and projects.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fund Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Fund Source *</Label>
              <Select 
                value={formData.source} 
                onValueChange={(value) => handleInputChange('source', value)}
                disabled={fundSourcesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={fundSourcesLoading ? "Loading sources..." : "Select fund source"} />
                </SelectTrigger>
                <SelectContent>
                  {fundSourcesLoading ? (
                    <SelectItem value="" disabled>Loading...</SelectItem>
                  ) : (
                    fundSources?.map((source: FundSource) => (
                      <SelectItem key={source.id} value={source.id.toString()}>
                        {source?.name || 'Unknown Source'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Target Project */}
            <div className="space-y-2">
              <Label htmlFor="target_project">Target Project *</Label>
              <Select 
                value={formData.target_project} 
                onValueChange={(value) => handleInputChange('target_project', value)}
                disabled={projectsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select project"} />
                </SelectTrigger>
                <SelectContent>
                  {projectsLoading ? (
                    <SelectItem value="" disabled>Loading...</SelectItem>
                  ) : (
                    projects?.map((project: Project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        <div className="flex flex-col">
                          <span>{project?.name || 'Unknown Project'}</span>
                        <span className="text-xs text-muted-foreground">
                          {project?.department?.name || project?.department_name || 'No Department'} - ₹{Number(project?.remaining_budget || 0).toLocaleString()} remaining
                        </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount"
            />
            {formData.target_project && projects && (
              <div className="text-sm text-muted-foreground">
                Available budget: ₹{Number(projects.find((p: Project) => p.id.toString() === formData.target_project)?.remaining_budget || 0).toLocaleString()}
              </div>
            )}
          </div>

          {/* Transaction Date */}
          <div className="space-y-2">
            <Label>Transaction Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the purpose of this fund flow..."
              rows={3}
            />
          </div>

          {/* Fund Flow Preview */}
          {formData.source && formData.target_project && formData.amount && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {fundSources?.find((s: FundSource) => s.id.toString() === formData.source)?.name || 'Unknown Source'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">
                    {projects?.find((p: Project) => p.id.toString() === formData.target_project)?.name || 'Unknown Project'}
                  </span>
                </div>
                <div className="text-lg font-bold text-primary">
                  ₹{parseFloat(formData.amount || '0').toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createFundFlowMutation.isPending || fundSourcesLoading || projectsLoading}
            >
              {createFundFlowMutation.isPending ? 'Creating...' : 'Create Fund Flow'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
