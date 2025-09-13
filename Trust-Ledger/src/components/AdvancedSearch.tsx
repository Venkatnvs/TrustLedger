import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, X, Calendar, DollarSign, Building2, AlertTriangle } from 'lucide-react';
import { searchAPI } from '@/lib/api';
import type { SearchFilters, SearchResults, Project } from '@/lib/types';

interface AdvancedSearchProps {
  onResultSelect?: (result: any) => void;
}

export function AdvancedSearch({ onResultSelect }: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch departments for filter options
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await fetch('/api/core/departments/');
      return response.json();
    },
  });

  // Search transactions
  const { data: transactionResults, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['search-transactions', searchQuery, filters],
    queryFn: async () => {
      const params = {
        q: searchQuery,
        ...filters,
      };
      const response = await searchAPI.searchTransactions(params);
      return response.data;
    },
    enabled: activeTab === 'transactions' && (searchQuery.length > 0 || Object.keys(filters).length > 0),
  });

  // Search projects
  const { data: projectResults, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['search-projects', searchQuery, filters],
    queryFn: async () => {
      const params = {
        q: searchQuery,
        ...filters,
      };
      const response = await searchAPI.searchProjects(params);
      return response.data;
    },
    enabled: activeTab === 'projects' && (searchQuery.length > 0 || Object.keys(filters).length > 0),
  });

  const handleFilterChange = (key: keyof SearchFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'anomaly':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Advanced Search</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search transactions, projects, departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>
            {(searchQuery || Object.keys(filters).length > 0) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={filters.department_id || ''}
                  onValueChange={(value) => handleFilterChange('department_id', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => handleFilterChange('status', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {activeTab === 'transactions' ? (
                      <>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="anomaly">Anomaly</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Select
                  value={filters.year || ''}
                  onValueChange={(value) => handleFilterChange('year', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {activeTab === 'transactions' && (
                <>
                  <div>
                    <Label htmlFor="min_amount">Min Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.min_amount || ''}
                      onChange={(e) => handleFilterChange('min_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_amount">Max Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="No limit"
                      value={filters.max_amount || ''}
                      onChange={(e) => handleFilterChange('max_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </>
              )}

              {activeTab === 'projects' && (
                <>
                  <div>
                    <Label htmlFor="min_budget">Min Budget (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.min_budget || ''}
                      onChange={(e) => handleFilterChange('min_budget', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_budget">Max Budget (₹)</Label>
                    <Input
                      type="number"
                      placeholder="No limit"
                      value={filters.max_budget || ''}
                      onChange={(e) => handleFilterChange('max_budget', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Search Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              {isLoadingTransactions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Searching transactions...</p>
                </div>
              ) : transactionResults?.results?.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Found {transactionResults.count} transactions
                    </p>
                  </div>
                  {transactionResults.results.map((transaction: any) => (
                    <Card 
                      key={transaction.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onResultSelect?.(transaction)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-primary" />
                              <span className="font-medium">
                                {formatCurrency(transaction.amount)}
                              </span>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {transaction.description || 'No description'}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(transaction.transaction_date)}</span>
                              </span>
                              {transaction.source && (
                                <span>Source: {transaction.source}</span>
                              )}
                            </div>
                          </div>
                          {transaction.status === 'anomaly' && (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions found. Try adjusting your search criteria.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              {isLoadingProjects ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Searching projects...</p>
                </div>
              ) : projectResults?.results?.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Found {projectResults.count} projects
                    </p>
                  </div>
                  {projectResults.results.map((project: Project) => (
                    <Card 
                      key={project.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onResultSelect?.(project)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-primary" />
                              <span className="font-medium">{project.name}</span>
                              <Badge className={getProjectStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {project.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <DollarSign className="w-3 h-3" />
                                <span>Budget: {formatCurrency(project.budget)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Started: {formatDate(project.startDate)}</span>
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(project.spent / project.budget) * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((project.spent / project.budget) * 100)}% utilized
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No projects found. Try adjusting your search criteria.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
