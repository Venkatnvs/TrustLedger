import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchFilters } from "@/components/SearchFilters";
import { useRole } from "@/hooks/useRole";
import { 
  Search, 
  Building2, 
  Calendar, 
  Users, 
  FileText, 
  History, 
  AlertTriangle,
  Filter,
  SortAsc,
  Eye,
  TrendingUp
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  totalBudget: number;
  departmentId?: string;
  vendorId?: string;
  startDate?: string;
  expectedBeneficiaries?: number;
  verificationStatus?: string;
  location?: string;
}

interface SearchFiltersType {
  departmentId: string;
  status: string;
  minAmount?: number;
  maxAmount?: number;
  year: string;
  verificationStatus: string;
}

export default function SearchPage() {
  const { currentRole } = useRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<SearchFiltersType>({
    departmentId: "",
    status: "",
    minAmount: undefined,
    maxAmount: undefined,
    year: "",
    verificationStatus: ""
  });
  const [sortBy, setSortBy] = useState("date");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ["/api/projects/search", debouncedQuery, filters, sortBy],
    enabled: debouncedQuery.length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.minAmount && { minAmount: filters.minAmount.toString() }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount.toString() }),
        ...(filters.year && { year: filters.year }),
        ...(filters.verificationStatus && { verificationStatus: filters.verificationStatus })
      });
      
      const response = await fetch(`/api/projects/search?${params}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    }
  });

  const handleFilterChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({
      departmentId: "",
      status: "",
      minAmount: undefined,
      maxAmount: undefined,
      year: "",
      verificationStatus: ""
    });
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-verified border-verified";
      case "approved": return "text-primary border-primary";
      case "pending": return "text-warning border-warning";
      case "cancelled": return "text-anomaly border-anomaly";
      default: return "text-muted-foreground border-muted";
    }
  };

  const getVerificationColor = (status?: string) => {
    switch (status) {
      case "verified": return "text-verified border-verified";
      case "under_review": return "text-warning border-warning";
      case "anomaly": return "text-anomaly border-anomaly";
      default: return "text-muted-foreground border-muted";
    }
  };

  return (
    <main className="min-h-screen bg-background" data-testid="page-search">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">Public Search Portal</h1>
          <p className="text-muted-foreground">Search and filter fund flows by vendor, project, department, or year</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-sm" data-testid="card-search-filters">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Search Filters</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden"
                      data-testid="button-toggle-filters"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
                  <div className="space-y-6">
                    {/* Search Input */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Search Query</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search projects, vendors..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                          data-testid="input-search-query"
                        />
                      </div>
                    </div>

                    {/* Search Filters Component */}
                    <SearchFilters
                      filters={filters}
                      onFiltersChange={handleFilterChange}
                    />

                    {/* Clear Filters */}
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="w-full"
                      data-testid="button-clear-filters"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Search Results */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm" data-testid="card-search-results">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Search Results</CardTitle>
                  <div className="flex items-center space-x-2">
                    {searchResults && (
                      <span className="text-sm text-muted-foreground" data-testid="text-results-count">
                        {searchResults.length} results found
                      </span>
                    )}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1 border border-border rounded text-sm bg-background"
                      data-testid="select-sort-by"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="amount">Sort by Amount</option>
                      <option value="department">Sort by Department</option>
                      <option value="status">Sort by Status</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search Status */}
                {!debouncedQuery || debouncedQuery.length < 2 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Start Your Search</h3>
                    <p className="text-muted-foreground">
                      Enter at least 2 characters to search for projects, vendors, or departments.
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-6 border border-border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                        </div>
                        <Skeleton className="h-16 w-full mb-3" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-28" />
                          </div>
                          <div className="flex space-x-2">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-destructive mb-2">Search Failed</h3>
                    <p className="text-muted-foreground">
                      Unable to perform search. Please try again.
                    </p>
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((project: Project) => (
                      <div
                        key={project.id}
                        className="p-6 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        data-testid={`search-result-${project.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-foreground mb-1" data-testid={`result-title-${project.id}`}>
                              {project.name}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              Department: {project.departmentId?.slice(0, 8)}... • {project.location || 'Location not specified'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary" data-testid={`result-amount-${project.id}`}>
                              ₹{parseFloat(project.totalBudget.toString()).toLocaleString('en-IN')}
                            </div>
                            <div className="flex items-center justify-end mt-1 space-x-2">
                              <Badge 
                                variant="outline" 
                                className={getStatusColor(project.status)}
                              >
                                {project.status}
                              </Badge>
                              {project.verificationStatus && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getVerificationColor(project.verificationStatus)}`}
                                >
                                  {project.verificationStatus.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3" data-testid={`result-description-${project.id}`}>
                          {project.description || "No description available"}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {project.startDate ? new Date(project.startDate).toLocaleDateString('en-IN') : 'No start date'}
                            </span>
                            <span className="flex items-center">
                              <Building2 className="w-3 h-3 mr-1" />
                              Vendor ID: {project.vendorId?.slice(0, 8) || 'TBD'}...
                            </span>
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {project.expectedBeneficiaries || 0} beneficiaries
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" data-testid={`button-view-documents-${project.id}`}>
                              <FileText className="w-4 h-4 mr-1" />
                              Documents
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-view-timeline-${project.id}`}>
                              <History className="w-4 h-4 mr-1" />
                              Timeline
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
                    <p className="text-muted-foreground">
                      No projects match your search criteria. Try adjusting your search terms or filters.
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {searchResults && searchResults.length > 0 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing 1-{Math.min(10, searchResults.length)} of {searchResults.length} results
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
        </div>
      </div>
    </main>
  );
}
