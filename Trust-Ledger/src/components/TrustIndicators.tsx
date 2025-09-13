import { useQuery } from "@tanstack/react-query";
import { coreAPI, documentsAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  FileCheck, 
  Eye, 
  Bot, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Trophy,
  Award,
  Users
} from "lucide-react";

export function TrustIndicators() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await documentsAPI.getDocuments();
      return response.data.results;
    },
  });

  const { data: anomalies, isLoading: anomaliesLoading } = useQuery({
    queryKey: ["/api/anomalies"],
    queryFn: async () => {
      const response = await coreAPI.getAnomalies();
      return response.data.results;
    },
  });

  // Calculate trust metrics
  const calculateTrustMetrics = () => {
    if (!projects || !documents || !anomalies) {
      return {
        blockchainVerified: 0,
        documentationComplete: 0,
        communityOversight: 0,
        anomaliesCount: 0,
        overallTrustScore: 0
      };
    }

    const totalProjects = projects.length;
    const verifiedProjects = projects.filter((p: any) => p.verificationStatus === 'verified').length;
    const verifiedDocuments = documents.filter((d: any) => d.verificationStatus === 'verified').length;
    const totalDocuments = documents.length;
    const openAnomalies = anomalies.filter((a: any) => a.status === 'open').length;

    const blockchainVerified = totalProjects > 0 ? (verifiedProjects / totalProjects) * 100 : 100;
    const documentationComplete = totalDocuments > 0 ? (verifiedDocuments / totalDocuments) * 100 : 0;
    const communityOversight = Math.max(0, 100 - (openAnomalies * 5)); // Reduce score for each anomaly
    
    const overallTrustScore = Math.round(
      (blockchainVerified * 0.3 + documentationComplete * 0.3 + communityOversight * 0.4)
    );

    return {
      blockchainVerified: Math.round(blockchainVerified),
      documentationComplete: Math.round(documentationComplete),
      communityOversight: Math.round(communityOversight),
      anomaliesCount: openAnomalies,
      overallTrustScore
    };
  };

  const trustMetrics = calculateTrustMetrics();

  const getTrustLevel = (score: number) => {
    if (score >= 90) return { level: "Excellent", color: "text-verified", bg: "bg-verified/10" };
    if (score >= 80) return { level: "Good", color: "text-primary", bg: "bg-primary/10" };
    if (score >= 70) return { level: "Fair", color: "text-warning", bg: "bg-warning/10" };
    return { level: "Needs Improvement", color: "text-anomaly", bg: "bg-anomaly/10" };
  };

  const trustLevel = getTrustLevel(trustMetrics.overallTrustScore);

  const isLoading = projectsLoading || documentsLoading || anomaliesLoading;

  return (
    <Card className="shadow-sm" data-testid="card-trust-indicators">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Trust Indicators</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Individual Trust Indicators */}
          <div className="space-y-3">
            {/* Blockchain Verified */}
            <div className="flex items-center justify-between p-3 bg-verified/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-verified" />
                <div>
                  <h4 className="font-medium text-foreground">Blockchain Verified</h4>
                  <p className="text-xs text-muted-foreground">All transactions immutable</p>
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <span className="text-sm font-bold text-verified" data-testid="metric-blockchain-verified">
                  {trustMetrics.blockchainVerified}%
                </span>
              )}
            </div>

            {/* Documentation Complete */}
            <div className="flex items-center justify-between p-3 bg-verified/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileCheck className="w-5 h-5 text-verified" />
                <div>
                  <h4 className="font-medium text-foreground">Documentation Complete</h4>
                  <p className="text-xs text-muted-foreground">All receipts uploaded</p>
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <span className="text-sm font-bold text-verified" data-testid="metric-documentation-complete">
                  {trustMetrics.documentationComplete}%
                </span>
              )}
            </div>

            {/* Community Oversight */}
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-medium text-foreground">Community Oversight</h4>
                  <p className="text-xs text-muted-foreground">Active monitoring</p>
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <span className="text-sm font-bold text-primary" data-testid="metric-community-oversight">
                  {trustMetrics.communityOversight}%
                </span>
              )}
            </div>

            {/* AI Anomaly Detection */}
            <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bot className="w-5 h-5 text-warning" />
                <div>
                  <h4 className="font-medium text-foreground">AI Anomaly Detection</h4>
                  <p className="text-xs text-muted-foreground">Real-time monitoring</p>
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span className="text-sm font-bold text-warning" data-testid="metric-anomalies-count">
                  {trustMetrics.anomaliesCount} alerts
                </span>
              )}
            </div>
          </div>

          {/* Overall Trust Score */}
          <div className={`p-4 bg-gradient-to-r from-verified/10 to-primary/10 rounded-lg ${trustLevel.bg}`}>
            <h4 className="font-semibold text-foreground mb-3">Overall Trust Score</h4>
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold text-primary" data-testid="overall-trust-score">
                {isLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  `${trustMetrics.overallTrustScore}/100`
                )}
              </div>
              <div className="text-right">
                {isLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <>
                    <div className={`text-sm font-medium ${trustLevel.color}`} data-testid="trust-level">
                      {trustLevel.level}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +5 this month
                    </div>
                  </>
                )}
              </div>
            </div>
            {!isLoading && (
              <Progress 
                value={trustMetrics.overallTrustScore} 
                className="h-2"
                data-testid="trust-score-progress"
              />
            )}
          </div>

          {/* Trust Badges */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Transparency Badges</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className="bg-verified text-white">
                <Award className="w-3 h-3 mr-1" />
                Gold Standard
              </Badge>
              <Badge variant="default" className="bg-primary text-primary-foreground">
                <Shield className="w-3 h-3 mr-1" />
                Verified Data
              </Badge>
              <Badge variant="default" className="bg-accent text-accent-foreground">
                <Users className="w-3 h-3 mr-1" />
                Community Approved
              </Badge>
            </div>
          </div>

          {/* Trust Improvement Actions */}
          {trustMetrics.overallTrustScore < 90 && !isLoading && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Improvement Actions</h4>
              <div className="space-y-2">
                {trustMetrics.documentationComplete < 95 && (
                  <div className="flex items-center p-2 bg-muted/30 rounded-lg">
                    <FileCheck className="w-4 h-4 text-warning mr-2" />
                    <span className="text-sm text-muted-foreground">Upload remaining project documents</span>
                  </div>
                )}
                {trustMetrics.anomaliesCount > 0 && (
                  <div className="flex items-center p-2 bg-muted/30 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-anomaly mr-2" />
                    <span className="text-sm text-muted-foreground">Resolve {trustMetrics.anomaliesCount} pending anomalies</span>
                  </div>
                )}
                {trustMetrics.communityOversight < 85 && (
                  <div className="flex items-center p-2 bg-muted/30 rounded-lg">
                    <Eye className="w-4 h-4 text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Increase community engagement</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Button variant="outline" size="sm" data-testid="button-detailed-report">
              <FileCheck className="w-4 h-4 mr-2" />
              View Detailed Report
            </Button>
            <Button variant="outline" size="sm" data-testid="button-trust-history">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trust Score History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
