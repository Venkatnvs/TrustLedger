import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { coreAPI } from "@/lib/api";

export interface SearchFiltersType {
  departmentId: string;
  status: string;
  minAmount?: number;
  maxAmount?: number;
  year: string;
  verificationStatus: string;
}

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await coreAPI.getDepartments();
      return response.data.results;
    },
  });

  const handleFilterChange = (key: keyof SearchFiltersType, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      departmentId: "all",
      status: "all",
      minAmount: undefined,
      maxAmount: undefined,
      year: "all",
      verificationStatus: "all",
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Search Filters</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            data-testid="button-toggle-advanced"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showAdvanced ? "Hide" : "Show"} Advanced
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={filters.departmentId} onValueChange={(value) => handleFilterChange("departmentId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
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
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="year">Year</Label>
            <Select value={filters.year} onValueChange={(value) => handleFilterChange("year", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minAmount">Min Amount (₹)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="0"
                  value={filters.minAmount || ""}
                  onChange={(e) => handleFilterChange("minAmount", e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label htmlFor="maxAmount">Max Amount (₹)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  placeholder="1000000"
                  value={filters.maxAmount || ""}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="verificationStatus">Verification Status</Label>
              <Select value={filters.verificationStatus} onValueChange={(value) => handleFilterChange("verificationStatus", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Verification Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="anomaly">Anomaly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
          data-testid="button-clear-filters"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  );
}