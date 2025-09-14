import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DocumentUpload } from "@/components/DocumentUpload";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Image,
  FileType,
  Calendar,
  User,
  Building2
} from "lucide-react";
import { coreAPI, documentsAPI } from "@/lib/api";

interface Document {
  id: number;
  name: string;
  document_type: string;
  description?: string;
  file: string; // This is the file path from backend
  size: number; // File size in bytes
  verified: boolean; // Backend uses boolean, not verification_status string
  project?: {
    id: number;
    name: string;
  };
  uploaded_by?: {
    id: number;
    username: string;
  };
  uploaded_at?: string;
  verified_at?: string;
}

interface Project {
  id: number;
  name: string;
}

export default function Documents() {
  const { currentRole } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ["documents", selectedProject === "all" ? undefined : selectedProject],
    queryFn: async () => {
      try {
        const response = await documentsAPI.getDocuments();
        console.log('Documents API response:', response.data);
        return response.data.results || [];
      } catch (err) {
        console.error('Error fetching documents:', err);
        throw err;
      }
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const response = await coreAPI.getProjects();
        return response.data.results;
      } catch (err) {
        console.error('Error fetching projects:', err);
        throw err;
      }
    },
  });

  const filteredDocuments = documents?.filter((doc: Document) => {
    const matchesType = selectedType === "all" || doc.document_type === selectedType;
    const matchesVerification = verificationFilter === "all" || 
      (verificationFilter === "verified" && doc.verified) ||
      (verificationFilter === "under_review" && !doc.verified && !doc.verified_at) ||
      (verificationFilter === "rejected" && !doc.verified && doc.verified_at);
    const matchesSearch = !searchQuery || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesVerification && matchesSearch;
  }) || [];

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "invoice":
      case "receipt": 
        return <FileText className="w-5 h-5 text-primary" />;
      case "contract": 
        return <FileType className="w-5 h-5 text-accent" />;
      case "proof_of_work": 
        return <Image className="w-5 h-5 text-verified" />;
      default: 
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getVerificationIcon = (doc: Document) => {
    if (doc.verified) return <CheckCircle className="w-4 h-4 text-verified" />;
    if (!doc.verified && doc.verified_at) return <AlertTriangle className="w-4 h-4 text-anomaly" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const getVerificationColor = (doc: Document) => {
    if (doc.verified) return "text-verified border-verified bg-verified/10";
    if (!doc.verified && doc.verified_at) return "text-anomaly border-anomaly bg-anomaly/10";
    return "text-warning border-warning bg-warning/10";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = (document: Document) => {
    // Create a download link using the authenticated file serving endpoint
    const link = window.document.createElement('a');
    link.href = `https://trustledger-vvwh.onrender.com/api/documents/${document.id}/file/`;
    link.download = document.name;
    link.target = '_blank';
    link.click();
    
    toast({
      title: "Download Started",
      description: `Downloading ${document.name}`,
    });
  };

  const handleView = (document: Document) => {
    // Open document in new tab using the authenticated file serving endpoint
    window.open(`https://trustledger-vvwh.onrender.com/api/documents/${document.id}/file/`, '_blank');
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Documents</h2>
          <p className="text-muted-foreground">Unable to fetch document data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-x-hidden" data-testid="page-documents">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">Digital Receipt System</h1>
          <p className="text-muted-foreground">Upload, view, and verify invoices, vendor documents, and proof of work</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Document Upload */}
          <div className="space-y-6">
            <Card className="shadow-sm" data-testid="card-document-upload">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Upload Documents</span>
                  <Button
                    variant={showUpload ? "secondary" : "default"}
                    size="sm"
                    onClick={() => setShowUpload(!showUpload)}
                    data-testid="button-toggle-upload"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {showUpload ? "Hide Upload" : "Upload Files"}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showUpload && (
                <CardContent>
                  <DocumentUpload onUploadComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ["documents"] });
                    setShowUpload(false);
                  }} />
                </CardContent>
              )}
            </Card>

            {/* Upload Statistics */}
            <Card className="shadow-sm" data-testid="card-upload-stats">
              <CardHeader>
                <CardTitle>Document Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {documents?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Documents</div>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="text-2xl font-bold text-verified">
                      {documents?.filter((d: Document) => d.verified).length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Verified</div>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="text-2xl font-bold text-warning">
                      {documents?.filter((d: Document) => !d.verified && !d.verified_at).length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Under Review</div>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {documents?.reduce((sum: number, d: Document) => sum + (d.size || 0), 0) ? 
                        formatFileSize(documents.reduce((sum: number, d: Document) => sum + (d.size || 0), 0)) : 
                        '0 MB'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">Total Size</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Documents */}
          <Card className="shadow-sm" data-testid="card-recent-documents">
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                    data-testid="input-search-documents"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-full" data-testid="select-project-filter">
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects?.map((project: Project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name.length > 20 ? `${project.name.slice(0, 20)}...` : project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full" data-testid="select-type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="proof_of_work">Proof of Work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                    <SelectTrigger className="w-full" data-testid="select-verification-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <div className="space-y-1">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))
                ) : filteredDocuments.length > 0 ? (
                  filteredDocuments.map((document: Document) => (
                    <div 
                      key={document.id} 
                      className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors" 
                      data-testid={`document-item-${document.id}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getDocumentIcon(document.document_type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-foreground truncate" data-testid={`document-name-${document.id}`}>
                              {document.name}
                            </h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {document.document_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="flex items-center">
                            {getVerificationIcon(document)}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getVerificationColor(document)}`}
                            data-testid={`document-status-${document.id}`}
                          >
                            {document.verified ? 'Verified' : 
                             (!document.verified && document.verified_at) ? 'Rejected' : 'Under Review'}
                          </Badge>
                        </div>
                      </div>
                      
                      {document.description && (
                        <p className="text-sm text-muted-foreground mb-3" data-testid={`document-description-${document.id}`}>
                          {document.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          Project: {document.project?.name || 'General'}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString('en-IN') : 'No date'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            {formatFileSize(document.size)}
                          </span>
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            Uploader: {document.uploaded_by?.username || 'System'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownload(document)}
                            data-testid={`button-download-${document.id}`}
                            className="flex-1 sm:flex-none"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleView(document)}
                            data-testid={`button-view-${document.id}`}
                            className="flex-1 sm:flex-none"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Documents Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || selectedType !== "all" || verificationFilter !== "all" || selectedProject !== "all"
                        ? "No documents match your current filters."
                        : "No documents have been uploaded yet."
                      }
                    </p>
                  </div>
                )}
              </div>

              {filteredDocuments.length > 0 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" data-testid="button-view-all-documents">
                    View All Documents
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
