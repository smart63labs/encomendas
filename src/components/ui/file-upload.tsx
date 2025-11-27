import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUploadStatusColor } from "@/utils/badge-colors";
import {
  Upload,
  File,
  Image as ImageIcon,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: 'image' | 'pdf' | 'document' | 'other';
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // em MB
  acceptedTypes?: string[];
  className?: string;
}

const FileUpload = ({
  onFilesUploaded,
  maxFiles = 10,
  maxFileSize = 10,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  className
}: FileUploadProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): UploadedFile['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.includes('document') || file.type.includes('word')) return 'document';
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Verificar tamanho
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxFileSize}MB`;
    }

    // Verificar tipo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `Tipo de arquivo não suportado. Aceitos: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: Math.min(progress, 100) }
            : f
        ));
      }
    }, 200);
  };

  const processFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    Array.from(fileList).forEach((file) => {
      if (files.length + newFiles.length >= maxFiles) {
        return;
      }

      const error = validateFile(file);
      const fileId = Math.random().toString(36).substr(2, 9);
      
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileType(file),
        status: error ? 'error' : 'uploading',
        progress: error ? 0 : 0,
        error
      };

      newFiles.push(uploadedFile);

      if (!error) {
        // Simular upload
        setTimeout(() => simulateUpload(fileId), 100);
      }
    });

    setFiles(prev => [...prev, ...newFiles]);
    
    if (onFilesUploaded) {
      onFilesUploaded([...files, ...newFiles]);
    }
  }, [files, maxFiles, onFilesUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'document':
        return <FileText className="w-8 h-8 text-blue-600" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload de Arquivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Drop */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={cn(
            "w-12 h-12 mx-auto mb-4",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
          <h3 className="text-lg font-semibold mb-2">
            {isDragOver ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para selecionar"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Máximo {maxFiles} arquivos • Até {maxFileSize}MB cada
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: {acceptedTypes.join(', ')}
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Lista de Arquivos */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Arquivos ({files.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiles([])}
              >
                Limpar Todos
              </Button>
            </div>
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div key={file.id}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      {getFileIcon(file.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{file.name}</p>
                          <Badge 
                            variant="secondary" 
                            className={getUploadStatusColor(file.status)}
                          >
                            {file.status === 'uploading' && 'Enviando'}
                            {file.status === 'completed' && 'Concluído'}
                            {file.status === 'error' && 'Erro'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.type.toUpperCase()}</span>
                        </div>
                        
                        {file.status === 'uploading' && (
                          <Progress value={file.progress} className="mt-2 h-1" />
                        )}
                        
                        {file.status === 'error' && file.error && (
                          <p className="text-sm text-red-500 mt-1">{file.error}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {index < files.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { FileUpload, type UploadedFile };