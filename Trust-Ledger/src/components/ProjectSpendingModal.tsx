import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  Plus, 
  DollarSign, 
  Receipt, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  FileText,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { coreAPI, fundFlowsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';

interface Project {
  id: number;
  name: string;
  budget: number;
  spent: number;
  remaining_budget: number;
  department_name?: string;
}

interface SpendingRecord {
  id: number;
  project: number;
  project_name: string;
  amount: number;
  description: string;
  category: string;
  transaction_date: string;
  supporting_documents: string;
  status: string;
  created_by: number;
  created_by_name: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

interface SpendingFormData {
  amount: string;
  description: string;
  category: string;
  transaction_date: string;
  supporting_documents?: string;
}

const SPENDING_CATEGORIES = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'materials', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'services', label: 'Services' },
  { value: 'travel', label: 'Travel' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' }
];

const SPENDING_STATUSES = [
  { value: 'pending', label: 'Pending Review', color: 'text-warning bg-warning/10' },
  { value: 'approved', label: 'Approved', color: 'text-verified bg-verified/10' },
  { value: 'rejected', label: 'Rejected', color: 'text-anomaly bg-anomaly/10' },
  { value: 'under_audit', label: 'Under Audit', color: 'text-accent bg-accent/10' }
];

export function ProjectSpendingModal({ 
  project, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange 
}: { 
  project: Project;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [activeTab, setActiveTab] = useState('add');
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState<SpendingFormData>({
    amount: '',
    description: '',
    category: '',
    transaction_date: '',
    supporting_documents: ''
  });

  const queryClient = useQueryClient();

  // Fetch spending records for this project
  const { data: spendingRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['project-spending', project.id],
    queryFn: async () => {
      const response = await coreAPI.getProjectSpending(project.id);
      return response.data.results || response.data;
    },
  });

  // Add spending record mutation
  const addSpendingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await coreAPI.createProjectSpending({
        project: project.id,
        amount: parseFloat(data.amount),
        description: data.description,
        category: data.category,
        transaction_date: data.transaction_date,
        supporting_documents: data.supporting_documents,
        status: 'pending'
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-spending', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Spending record added successfully!');
      resetForm();
      setActiveTab('history');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add spending record');
    },
  });

  // Verify spending record mutation
  const verifySpendingMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      const response = await coreAPI.updateProjectSpending(id, {
        status,
        rejection_reason: status === 'rejected' ? notes : ''
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-spending', project.id] });
      toast.success('Spending record updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update spending record');
    },
  });

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category: '',
      transaction_date: '',
      supporting_documents: ''
    });
    setDate(undefined);
  };

  const handleInputChange = (field: keyof SpendingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount > project.remaining_budget) {
      toast.error(`Amount exceeds remaining budget (${formatCurrency(project.remaining_budget)})`);
      return;
    }

    const submitData = {
      project: project.id,
      amount: amount,
      description: formData.description,
      category: formData.category,
      transaction_date: date ? format(date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
      supporting_documents: formData.supporting_documents,
      status: 'pending'
    };

    addSpendingMutation.mutate(submitData);
  };

  const handleVerify = (recordId: number, status: string, notes: string) => {
    verifySpendingMutation.mutate({ id: recordId, status, notes });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4" />;
      case 'under_audit': return <Eye className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = SPENDING_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'text-muted-foreground bg-muted/10';
  };

  const totalSpending = spendingRecords?.reduce((sum: number, record: SpendingRecord) => sum + record.amount, 0) || 0;
  const approvedSpending = spendingRecords?.filter((r: SpendingRecord) => r.status === 'approved').reduce((sum: number, record: SpendingRecord) => sum + record.amount, 0) || 0;
  const pendingSpending = spendingRecords?.filter((r: SpendingRecord) => r.status === 'pending').reduce((sum: number, record: SpendingRecord) => sum + record.amount, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <DollarSign className="w-4 h-4 mr-1" />
            Manage Spending
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Spending Management - {project.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Project Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">{formatCurrency(project.budget)}</div>
                <div className="text-xs text-muted-foreground">Total Budget</div>
              </div>
              <div>
                <div className="text-lg font-bold text-verified">{formatCurrency(approvedSpending)}</div>
                <div className="text-xs text-muted-foreground">Approved Spending</div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent">{formatCurrency(project.remaining_budget)}</div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add">Add Spending</TabsTrigger>
            <TabsTrigger value="history">Spending History</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          {/* Add Spending Tab */}
          <TabsContent value="add" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={project.remaining_budget}
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="Enter amount"
                  />
                  <div className="text-xs text-muted-foreground">
                    Available: {formatCurrency(project.remaining_budget)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPENDING_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the expense..."
                  rows={3}
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="documents">Supporting Documents</Label>
                <Input
                  id="documents"
                  value={formData.supporting_documents}
                  onChange={(e) => handleInputChange('supporting_documents', e.target.value)}
                  placeholder="Document references or file names..."
                />
              </div>

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
                  disabled={addSpendingMutation.isPending}
                >
                  {addSpendingMutation.isPending ? 'Adding...' : 'Add Spending'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Spending History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              {recordsLoading ? (
                <div className="text-center py-8">Loading spending records...</div>
              ) : spendingRecords && spendingRecords.length > 0 ? (
                spendingRecords.map((record: SpendingRecord) => (
                  <Card key={record.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(record.status)}>
                          <span className="mr-1">{getStatusIcon(record.status)}</span>
                          {SPENDING_STATUSES.find(s => s.value === record.status)?.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {record.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {formatCurrency(record.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(record.transaction_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {record.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created by: {record.created_by_name}</span>
                      {record.approved_by_name && (
                        <span>Approved by: {record.approved_by_name}</span>
                      )}
                    </div>

                    {record.status === 'pending' && (
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleVerify(record.id, 'approved', 'Approved by admin')}
                          className="bg-verified hover:bg-verified/90"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerify(record.id, 'rejected', 'Rejected by admin')}
                          className="text-anomaly border-anomaly hover:bg-anomaly/10"
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No spending records found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audit Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{spendingRecords?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-verified">{spendingRecords?.filter((r: SpendingRecord) => r.status === 'approved').length || 0}</div>
                      <div className="text-xs text-muted-foreground">Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{spendingRecords?.filter((r: SpendingRecord) => r.status === 'pending').length || 0}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-anomaly">{spendingRecords?.filter((r: SpendingRecord) => r.status === 'rejected').length || 0}</div>
                      <div className="text-xs text-muted-foreground">Rejected</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h4 className="font-medium">Recent Activity</h4>
                {spendingRecords?.map((record: SpendingRecord) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 rounded ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{record.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.category} • {new Date(record.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{formatCurrency(record.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        by {record.created_by_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
