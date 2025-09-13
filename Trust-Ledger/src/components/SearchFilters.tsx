import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SearchFilters as SearchFiltersType } from "@/lib/types";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const handleFilterChange = (key: keyof SearchFiltersType, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Department Filter */}
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select 
          value={filters.departmentId} 
          onValueChange={(value) => handleFilterChange('departmentId', value)}
        >
          <SelectTrigger data-testid="select-department-filter">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="infrastructure">Infrastructure</SelectItem>
            <SelectItem value="welfare">Welfare</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select 
          value={filters.status} 
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger data-testid="select-status-filter">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Amount Range */}
      <div className="space-y-2">
        <Label>Amount Range (₹)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minAmount || ''}
            onChange={(e) => handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
            data-testid="input-min-amount"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxAmount || ''}
            onChange={(e) => handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
            data-testid="input-max-amount"
          />
        </div>
      </div>

      {/* Year Filter */}
      <div className="space-y-2">
        <Label htmlFor="year">Year</Label>
        <Select 
          value={filters.year} 
          onValueChange={(value) => handleFilterChange('year', value)}
        >
          <SelectTrigger data-testid="select-year-filter">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Years</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
            <SelectItem value="2021">2021</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Verification Status Filter */}
      <div className="space-y-2">
        <Label htmlFor="verification">Verification Status</Label>
        <Select 
          value={filters.verificationStatus} 
          onValueChange={(value) => handleFilterChange('verificationStatus', value)}
        >
          <SelectTrigger data-testid="select-verification-filter">
            <SelectValue placeholder="All Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Verification</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
