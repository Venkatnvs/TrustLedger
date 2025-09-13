import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Image,
  FileType
} from "lucide-react";
import { coreAPI, documentsAPI } from "@/lib/api";

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-verified" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-primary" />;
    if (type.includes('word') || type.includes('document')) return <FileType className="w-5 h-5 text-accent" />;
    return <FileText className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadFiles = async () => {
    if (!selectedProject || !documentType || files.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a project, document type, and add files to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = files.map(async (uploadFile) => {
        if (uploadFile.status === 'success') return;

        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        ));

        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append('project_id', selectedProject);
        formData.append('document_type', documentType);
        formData.append('description', description);

        try {
          const response = await documentsAPI.uploadDocument(formData);
          
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          ));

          return response;
        } catch (error: any) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { 
                  ...f, 
                  status: 'error' as const, 
                  error: error.response?.data?.message || 'Upload failed'
                }
              : f
          ));
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      
      toast({
        title: "Upload Successful",
        description: "All files have been uploaded successfully.",
      });

      // Reset form
      setFiles([]);
      setSelectedProject("");
      setDocumentType("");
      setDescription("");
      
      onUploadComplete?.();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          or click to select files
        </p>
        <p className="text-xs text-muted-foreground">
          Supports PDF, images, Word documents, and text files (max 10MB each)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Files to Upload</h4>
          {files.map((uploadFile) => (
            <div key={uploadFile.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                {getFileIcon(uploadFile.file)}
                <div>
                  <p className="font-medium text-foreground">{uploadFile.file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(uploadFile.file.size)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {uploadFile.status === 'uploading' && (
                  <div className="w-24">
                    <Progress value={uploadFile.progress} className="h-2" />
                  </div>
                )}
                
                {uploadFile.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-verified" />
                )}
                
                {uploadFile.status === 'error' && (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                )}
                
                {uploadFile.status !== 'uploading' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadFile.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="project">Project</Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="documentType">Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="receipt">Receipt</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="proof_of_work">Proof of Work</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Add a description for these documents..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Upload Button */}
      <Button 
        onClick={uploadFiles} 
        disabled={isUploading || files.length === 0}
        className="w-full"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload {files.length} file{files.length !== 1 ? 's' : ''}
          </>
        )}
      </Button>
    </div>
  );
}