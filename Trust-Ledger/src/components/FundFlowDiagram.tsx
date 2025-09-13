import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, BarChart3 } from "lucide-react";
import type { FundFlowNode } from "@/lib/types";
import { fundFlowsAPI } from "@/lib/api";

export function FundFlowDiagram() {
  const [selectedPeriod, setSelectedPeriod] = useState("2024-q3");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [viewMode, setViewMode] = useState<"flow" | "tree">("flow");
  const [selectedNode, setSelectedNode] = useState<FundFlowNode | null>(null);

  const { data: fundFlowData, isLoading } = useQuery({
    queryKey: ["fund-flow-diagram", selectedPeriod, selectedDepartment],
    queryFn: async () => {
      const response = await fundFlowsAPI.getFundFlowDiagram();
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Use real data from API or fallback to mock data
  const nodes = fundFlowData?.nodes || [
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
      case "verified": return "bg-green-500";
      case "under_review": return "bg-yellow-500";
      case "anomaly": return "bg-red-500";
      default: return "bg-gray-500";
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
        <div className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-xl p-8 min-h-96 overflow-hidden border border-gray-200 shadow-inner" data-testid="diagram-container">
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
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Fund Sources
                </h4>
                {nodes.filter((node: FundFlowNode) => node.type === "source").map((node: FundFlowNode) => (
                  <div
                    key={node.id}
                    className={`${getStatusColor(node.status)} text-white px-5 py-4 rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-white/20 backdrop-blur-sm`}
                    onClick={() => handleNodeClick(node)}
                    data-testid={`node-source-${node.id}`}
                    style={{
                      background: `linear-gradient(135deg, ${getStatusColor(node.status).replace('bg-', '') === 'green-500' ? '#10b981' : getStatusColor(node.status).replace('bg-', '') === 'yellow-500' ? '#f59e0b' : '#ef4444'}, ${getStatusColor(node.status).replace('bg-', '') === 'green-500' ? '#059669' : getStatusColor(node.status).replace('bg-', '') === 'yellow-500' ? '#d97706' : '#dc2626'})`
                    }}
                  >
                    <div className="text-sm font-semibold mb-1">{node.name}</div>
                    <div className="text-xs opacity-90 font-medium">₹{(node.amount / 100000).toFixed(0)}L</div>
                    <div className="text-xs opacity-75 mt-1 capitalize">{node.status.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>

              {/* Department Nodes */}
              <div className="absolute left-1/3 top-1/2 transform -translate-y-1/2 space-y-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Departments
                </h4>
                {nodes.filter((node: FundFlowNode) => node.type === "department").map((node: FundFlowNode) => (
                  <div
                    key={node.id}
                    className={`${getStatusColor(node.status)} text-white px-5 py-4 rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-white/20 backdrop-blur-sm`}
                    onClick={() => handleNodeClick(node)}
                    data-testid={`node-department-${node.id}`}
                    style={{
                      background: `linear-gradient(135deg, ${getStatusColor(node.status).replace('bg-', '') === 'green-500' ? '#10b981' : getStatusColor(node.status).replace('bg-', '') === 'yellow-500' ? '#f59e0b' : '#ef4444'}, ${getStatusColor(node.status).replace('bg-', '') === 'green-500' ? '#059669' : getStatusColor(node.status).replace('bg-', '') === 'yellow-500' ? '#d97706' : '#dc2626'})`
                    }}
                  >
                    <div className="text-sm font-semibold mb-1">{node.name}</div>
                    <div className="text-xs opacity-90 font-medium">₹{(node.amount / 100000).toFixed(0)}L</div>
                    <div className="flex items-center mt-2">
                      <span className={`w-2 h-2 ${getStatusColor(node.status)} rounded-full mr-2`}></span>
                      <span className="text-xs capitalize opacity-75">{node.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Project/Vendor Nodes */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Projects
                </h4>
                {nodes.filter((node: FundFlowNode) => node.type === "project").map((node: FundFlowNode) => (
                  <div
                    key={node.id}
                    className={`${getStatusColor(node.status)} text-white px-5 py-4 rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-white/20 backdrop-blur-sm`}
                    onClick={() => handleNodeClick(node)}
                    data-testid={`node-project-${node.id}`}
                    style={{
                      background: `linear-gradient(135deg, ${getStatusColor(node.status).replace('bg-', '') === 'green-500' ? '#10b981' : getStatusColor(node.status).replace('bg-', '') === 'yellow-500' ? '#f59e0b' : '#ef4444'}, ${getStatusColor(node.status).replace('bg-', '') === 'green-500' ? '#059669' : getStatusColor(node.status).replace('bg-', '') === 'yellow-500' ? '#d97706' : '#dc2626'})`
                    }}
                  >
                    <div className="text-sm font-semibold mb-1">{node.name}</div>
                    <div className="text-xs opacity-90 font-medium">₹{(node.amount / 100000).toFixed(0)}L</div>
                    <div className="text-xs opacity-75 mt-1 capitalize">{node.status.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>

              {/* Connection Lines */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 800 500">
                <defs>
                  <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                  </marker>
                  <marker id="arrowhead-yellow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                  </marker>
                  <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                  </marker>
                  <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                  </marker>
                </defs>
                {/* Source to Department connections */}
                <path d="M 120 180 Q 200 180 280 180" stroke="#10b981" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-green)" />
                <path d="M 120 250 Q 200 230 280 200" stroke="#f59e0b" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-yellow)" />
                <path d="M 120 320 Q 200 300 280 250" stroke="#3b82f6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-blue)" />
                
                {/* Department to Project connections */}
                <path d="M 380 180 Q 450 160 530 140" stroke="#10b981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-green)" />
                <path d="M 380 200 Q 450 190 530 180" stroke="#10b981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-green)" />
                <path d="M 380 250 Q 450 280 530 300" stroke="#f59e0b" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-yellow)" />
                <path d="M 380 320 Q 450 360 530 400" stroke="#ef4444" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-red)" />
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-background/90 border border-border rounded-lg p-3" data-testid="diagram-legend">
                <h4 className="text-sm font-medium mb-2">Trust Indicators</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span>Verified & Complete</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    <span>Under Review</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    <span>Anomaly Detected</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Flow Details Panel */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm" data-testid="panel-selected-flow">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Selected Flow
            </h4>
            <p className="text-sm text-gray-600">
              {selectedNode 
                ? `${selectedNode.name} - ₹${(selectedNode.amount / 100000).toFixed(0)}L`
                : "Click on any node to see detailed fund flow information"
              }
            </p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm" data-testid="panel-amount">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Amount
            </h4>
            <p className="text-2xl font-bold text-green-700">
              {selectedNode ? `₹${(selectedNode.amount / 100000).toFixed(0)}L` : "-"}
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm" data-testid="panel-status">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              Status
            </h4>
            <div className="flex items-center">
              {selectedNode ? (
                <>
                  <span className={`w-4 h-4 ${getStatusColor(selectedNode.status)} rounded-full mr-3 shadow-sm`}></span>
                  <span className="text-sm font-medium capitalize text-gray-700">{selectedNode.status.replace('_', ' ')}</span>
                </>
              ) : (
                <>
                  <span className="w-4 h-4 bg-gray-400 rounded-full mr-3"></span>
                  <span className="text-sm text-gray-500">Select flow to view status</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
