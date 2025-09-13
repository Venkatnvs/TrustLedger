import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, BarChart3 } from "lucide-react";
import type { FundFlowNode } from "@/lib/types";

export function FundFlowDiagram() {
  const [selectedPeriod, setSelectedPeriod] = useState("2024-q3");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [viewMode, setViewMode] = useState<"flow" | "tree">("flow");
  const [selectedNode, setSelectedNode] = useState<FundFlowNode | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["/api/fund-flows", selectedPeriod, selectedDepartment],
    refetchInterval: 30000,
  });

  useQuery({
    queryKey: ["/api/departments"],
  });

  // Mock data for visualization - in production this would come from the API
  const mockNodes: FundFlowNode[] = [
    {
      id: "gov-grant",
      name: "Government Grant",
      amount: 12000000,
      type: "source",
      status: "verified",
      position: { x: 50, y: 150 }
    },
    {
      id: "private-donations",
      name: "Private Donations",
      amount: 8000000,
      type: "source",
      status: "verified",
      position: { x: 50, y: 250 }
    },
    {
      id: "csr-funds",
      name: "CSR Funds",
      amount: 4000000,
      type: "source",
      status: "verified",
      position: { x: 50, y: 350 }
    },
    {
      id: "education-dept",
      name: "Education Department",
      amount: 9000000,
      type: "department",
      status: "verified",
      position: { x: 300, y: 150 }
    },
    {
      id: "healthcare-dept",
      name: "Healthcare Department",
      amount: 7000000,
      type: "department",
      status: "under_review",
      position: { x: 300, y: 250 }
    },
    {
      id: "infrastructure-dept",
      name: "Infrastructure Department",
      amount: 8000000,
      type: "department",
      status: "verified",
      position: { x: 300, y: 350 }
    },
    {
      id: "classroom-construction",
      name: "Classroom Construction",
      amount: 4500000,
      type: "project",
      status: "verified",
      position: { x: 550, y: 100 }
    },
    {
      id: "it-equipment",
      name: "IT Equipment",
      amount: 2500000,
      type: "project",
      status: "verified",
      position: { x: 550, y: 200 }
    },
    {
      id: "medical-supplies",
      name: "Medical Supplies",
      amount: 3000000,
      type: "project",
      status: "under_review",
      position: { x: 550, y: 300 }
    },
    {
      id: "road-maintenance",
      name: "Road Maintenance",
      amount: 3500000,
      type: "project",
      status: "anomaly",
      position: { x: 550, y: 400 }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-verified";
      case "under_review": return "bg-warning";
      case "anomaly": return "bg-anomaly";
      default: return "bg-muted";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "verified": return "text-white";
      case "under_review": return "text-white";
      case "anomaly": return "text-white";
      default: return "text-foreground";
    }
  };

  const handleNodeClick = (node: FundFlowNode) => {
    setSelectedNode(node);
  };

  return (
    <Card className="shadow-sm" data-testid="card-fund-flow-diagram">
      <CardContent className="p-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[150px]" data-testid="select-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-q3">2024 Q3</SelectItem>
                <SelectItem value="2024-q2">2024 Q2</SelectItem>
                <SelectItem value="2024-q1">2024 Q1</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]" data-testid="select-department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "tree" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tree")}
              data-testid="button-tree-view"
            >
              <Network className="w-4 h-4 mr-2" />
              Tree View
            </Button>
            <Button
              variant={viewMode === "flow" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("flow")}
              data-testid="button-flow-view"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Flow View
            </Button>
          </div>
        </div>

        {/* Diagram Container */}
        <div className="relative bg-gradient-to-r from-muted/30 to-background rounded-lg p-8 min-h-96 overflow-hidden" data-testid="diagram-container">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Fund Source Nodes */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Fund Sources</h4>
                {mockNodes.filter(node => node.type === "source").map((node) => (
                  <div
                    key={node.id}
                    className={`sankey-node ${getStatusColor(node.status)} text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer transition-all hover:scale-105`}
                    onClick={() => handleNodeClick(node)}
                    data-testid={`node-source-${node.id}`}
                  >
                    <div className="text-sm font-medium">{node.name}</div>
                    <div className="text-xs opacity-90">₹{(node.amount / 100000).toFixed(0)}L</div>
                  </div>
                ))}
              </div>

              {/* Department Nodes */}
              <div className="absolute left-1/3 top-1/2 transform -translate-y-1/2 space-y-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Departments</h4>
                {mockNodes.filter(node => node.type === "department").map((node) => (
                  <div
                    key={node.id}
                    className={`sankey-node ${getStatusColor(node.status)} text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer transition-all hover:scale-105`}
                    onClick={() => handleNodeClick(node)}
                    data-testid={`node-department-${node.id}`}
                  >
                    <div className="text-sm font-medium">{node.name}</div>
                    <div className="text-xs opacity-90">₹{(node.amount / 100000).toFixed(0)}L</div>
                    <div className="flex items-center mt-1">
                      <span className={`w-2 h-2 ${getStatusColor(node.status)} rounded-full mr-1`}></span>
                      <span className="text-xs capitalize">{node.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Project/Vendor Nodes */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Projects</h4>
                {mockNodes.filter(node => node.type === "project").map((node) => (
                  <div
                    key={node.id}
                    className={`sankey-node ${getStatusColor(node.status)} text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer transition-all hover:scale-105`}
                    onClick={() => handleNodeClick(node)}
                    data-testid={`node-project-${node.id}`}
                  >
                    <div className="text-sm font-medium">{node.name}</div>
                    <div className="text-xs opacity-90">₹{(node.amount / 100000).toFixed(0)}L</div>
                  </div>
                ))}
              </div>

              {/* Connection Lines */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-primary/40" />
                  </marker>
                </defs>
                {/* Sample flow lines - in production these would be dynamically generated */}
                <path d="M 150 180 Q 225 180 300 180" stroke="currentColor" strokeWidth="3" fill="none" className="text-verified/40" markerEnd="url(#arrowhead)" />
                <path d="M 150 250 Q 225 225 300 200" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary/40" markerEnd="url(#arrowhead)" />
                <path d="M 150 320 Q 225 285 300 250" stroke="currentColor" strokeWidth="2" fill="none" className="text-accent/40" markerEnd="url(#arrowhead)" />
                <path d="M 400 180 Q 475 160 550 140" stroke="currentColor" strokeWidth="2" fill="none" className="text-verified/40" markerEnd="url(#arrowhead)" />
                <path d="M 400 200 Q 475 190 550 180" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary/40" markerEnd="url(#arrowhead)" />
                <path d="M 400 250 Q 475 275 550 300" stroke="currentColor" strokeWidth="2" fill="none" className="text-warning/40" markerEnd="url(#arrowhead)" />
                <path d="M 400 320 Q 475 360 550 400" stroke="currentColor" strokeWidth="2" fill="none" className="text-anomaly/40" markerEnd="url(#arrowhead)" />
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-background/90 border border-border rounded-lg p-3" data-testid="diagram-legend">
                <h4 className="text-sm font-medium mb-2">Trust Indicators</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-verified rounded-full mr-2"></span>
                    <span>Verified & Complete</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-warning rounded-full mr-2"></span>
                    <span>Under Review</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-anomaly rounded-full mr-2"></span>
                    <span>Anomaly Detected</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Flow Details Panel */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-4" data-testid="panel-selected-flow">
            <h4 className="font-medium text-foreground mb-2">Selected Flow</h4>
            <p className="text-sm text-muted-foreground">
              {selectedNode 
                ? `${selectedNode.name} - ₹${(selectedNode.amount / 100000).toFixed(0)}L`
                : "Click on any node to see detailed fund flow information"
              }
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4" data-testid="panel-amount">
            <h4 className="font-medium text-foreground mb-2">Amount</h4>
            <p className="text-lg font-bold text-primary">
              {selectedNode ? `₹${(selectedNode.amount / 100000).toFixed(0)}L` : "-"}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4" data-testid="panel-status">
            <h4 className="font-medium text-foreground mb-2">Status</h4>
            <div className="flex items-center">
              {selectedNode ? (
                <>
                  <span className={`w-3 h-3 ${getStatusColor(selectedNode.status)} rounded-full mr-2`}></span>
                  <span className="text-sm capitalize">{selectedNode.status.replace('_', ' ')}</span>
                </>
              ) : (
                <>
                  <span className="w-3 h-3 bg-muted rounded-full mr-2"></span>
                  <span className="text-sm text-muted-foreground">Select flow to view status</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
