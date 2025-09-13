import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, CheckCircle, AlertTriangle } from "lucide-react";

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'uploading'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    // Simulate upload progress
    newFiles.forEach((uploadedFile) => {
      simulateUpload(uploadedFile);
    });
  }, []);

  const simulateUpload = async (uploadedFile: UploadedFile) => {
    const totalSteps = 10;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = (currentStep / totalSteps) * 100;

      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, progress }
            : f
        )
      );

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        
        // Simulate success/failure
        const isSuccess = Math.random() > 0.1; // 90% success rate
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadedFile.id 
              ? { 
                  ...f, 
                  progress: 100,
                  status: isSuccess ? 'completed' : 'error',
                  error: isSuccess ? undefined : 'Upload failed. Please try again.'
                }
              : f
          )
        );

        if (isSuccess) {
          toast({
            title: "Upload Successful",
            description: `${uploadedFile.file.name} has been uploaded successfully.`,
          });
        } else {
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${uploadedFile.file.name}. Please try again.`,
            variant: "destructive",
          });
        }

        // Check if all uploads are complete
        setTimeout(() => {
          setUploadedFiles(prev => {
            const allComplete = prev.every(f => f.status !== 'uploading');
            if (allComplete) {
              setIsUploading(false);
              onUploadComplete?.();
            }
            return prev;
          });
        }, 1000);
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <FileText className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        data-testid="dropzone"
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to select files
          </p>
          <p className="text-xs text-muted-foreground">
            Supports PDF, DOC, XLS, and image files up to 10MB
          </p>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Uploaded Files</h4>
          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-4" data-testid={`uploaded-file-${uploadedFile.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(uploadedFile.file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'uploading' && (
                    <div className="w-16">
                      <Progress value={uploadedFile.progress} className="h-2" />
                    </div>
                  )}
                  
                  {uploadedFile.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-verified" />
                  )}
                  
                  {uploadedFile.status === 'error' && (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    data-testid={`button-remove-${uploadedFile.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {uploadedFile.error && (
                <p className="text-xs text-destructive mt-2" data-testid={`error-${uploadedFile.id}`}>
                  {uploadedFile.error}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Upload Summary */}
      {uploadedFiles.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {uploadedFiles.filter(f => f.status === 'completed').length} of {uploadedFiles.length} files uploaded
          </span>
          {isUploading && (
            <span className="text-primary">Uploading...</span>
          )}
        </div>
      )}
    </div>
  );
}
