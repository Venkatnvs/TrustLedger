import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RoleSelector } from "@/components/RoleSelector";
import { FundFlowDiagram } from "@/components/FundFlowDiagram";
import { TrustIndicators } from "@/components/TrustIndicators";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Building2, AlertTriangle, Users, FileCheck, Eye, Bot } from "lucide-react";
import type { DashboardMetrics } from "@/lib/types";
import { coreAPI } from "@/lib/api";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";

export default function Dashboard() {
  const { currentRole, roleConfig } = useRole();
  const { toast } = useToast();

  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const response = await coreAPI.getDashboardMetrics();
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">
            Unable to fetch dashboard metrics. Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" data-testid="page-dashboard">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your financial transparency platform</p>
          </div>
          </div>
      </div>

      {/* Hero Section with Role Selector */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-8" data-testid="section-hero">
        <div className="container mx-auto px-4">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Budget */}
            <Card className="shadow-sm fade-in" data-testid="card-total-budget">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-verified/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-verified" />
                  </div>
                  <div className="w-3 h-3 bg-verified rounded-full pulse-slow"></div>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-total-budget">
                      {formatCurrency(metrics?.total_budget || 0)}
                    </h3>
                    <p className="text-sm text-muted-foreground">Total Budget Allocated</p>
                    <div className="mt-2 flex items-center text-xs text-verified">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span>+12% from last year</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Utilized Funds */}
            <Card className="shadow-sm fade-in" data-testid="card-utilized-funds">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div className="w-3 h-3 bg-primary rounded-full pulse-slow"></div>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-utilized-funds">
                      {formatCurrency(metrics?.utilized_funds || 0)}
                    </h3>
                    <p className="text-sm text-muted-foreground">Funds Utilized</p>
                    <div className="mt-2 flex items-center text-xs text-primary">
                      <span>
                        {metrics?.total_budget ? 
                          Math.round((metrics.utilized_funds / metrics.total_budget) * 100) : 0
                        }% utilization rate
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card className="shadow-sm fade-in" data-testid="card-active-projects">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <div className="w-3 h-3 bg-accent rounded-full pulse-slow"></div>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-active-projects">
                      {metrics?.active_projects || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <div className="mt-2 flex items-center text-xs text-accent">
                      <span>8 completed this month</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Anomalies */}
            <Card className="shadow-sm fade-in" data-testid="card-anomalies">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                  <div className="w-3 h-3 bg-warning rounded-full pulse-slow"></div>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-anomalies-count">
                      {metrics?.anomalies_count || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Anomalies Detected</p>
                    <div className="mt-2 flex items-center text-xs text-warning">
                      <span>Requires review</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fund Flow Visualization */}
      <section className="py-12 bg-background" data-testid="section-fund-flow">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Interactive Fund Flow</h2>
            <p className="text-muted-foreground">Track how funds move from source to impact. Click nodes to drill down.</p>
          </div>
          
          <FundFlowDiagram />
        </div>
      </section>

      {/* Trust & Community Section */}
      {(currentRole === 'auditor' || currentRole === 'committee') && (
        <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5" data-testid="section-trust">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Trust & Community</h2>
              <p className="text-muted-foreground">Community oversight, trust indicators, and transparency rankings</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <TrustIndicators />
              
              {/* Community Oversight */}
              <Card className="shadow-sm" data-testid="card-community-oversight">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Community Oversight</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Active Watchers</h4>
                        <p className="text-xs text-muted-foreground">Citizens monitoring funds</p>
                      </div>
                      <span className="text-xl font-bold text-primary" data-testid="text-active-watchers">247</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Questions Raised</h4>
                        <p className="text-xs text-muted-foreground">This month</p>
                      </div>
                      <span className="text-xl font-bold text-accent" data-testid="text-questions-raised">12</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Issues Flagged</h4>
                        <p className="text-xs text-muted-foreground">Community reports</p>
                      </div>
                      <span className="text-xl font-bold text-warning" data-testid="text-issues-flagged">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transparency Rankings */}
              <Card className="shadow-sm" data-testid="card-transparency-rankings">
                <CardHeader>
                  <CardTitle>Transparency Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-foreground">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Education Dept</h4>
                          <p className="text-xs text-verified">Most Transparent</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="default" className="bg-primary">98/100</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-accent-foreground">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Healthcare Dept</h4>
                          <p className="text-xs text-muted-foreground">Highly Transparent</p>
                        </div>
                      </div>
                      <Badge variant="secondary">94/100</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Infrastructure</h4>
                          <p className="text-xs text-muted-foreground">Good Progress</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-warning border-warning">86/100</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
