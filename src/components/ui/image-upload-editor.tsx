import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Loader2,
  Link,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadEditorProps {
  value?: string;
  onChange?: (url: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  maxFileSize?: number; // em MB
  acceptedTypes?: string[];
}

const ImageUploadEditor = ({
  value = '',
  onChange,
  label = 'Imagem',
  placeholder = 'URL da imagem ou faça upload',
  className,
  maxFileSize = 5,
  acceptedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
}: ImageUploadEditorProps) => {
  const [imageUrl, setImageUrl] = useState(value);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualizar estado interno quando value prop mudar
  React.useEffect(() => {
    setImageUrl(value);
  }, [value]);

  const validateFile = (file: File): string | null => {
    // Verificar tipo de arquivo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `Tipo de arquivo não suportado. Use: ${acceptedTypes.join(', ')}`;
    }

    // Verificar tamanho do arquivo
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `Arquivo muito grande. Máximo: ${maxFileSize}MB`;
    }

    return null;
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Converter arquivo para base64 ou URL temporária
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        onChange?.(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Erro ao processar o arquivo');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError('Erro no upload da imagem');
      setIsUploading(false);
    }
  }, [onChange, maxFileSize, acceptedTypes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    onChange?.(url);
    setPreviewError(false);
    setUploadError(null);
  };

  const handleImageError = () => {
    setPreviewError(true);
  };

  const handleImageLoad = () => {
    setPreviewError(false);
  };

  const clearImage = () => {
    setImageUrl('');
    onChange?.('');
    setPreviewError(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      
      {/* Input de URL */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="url"
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            className="w-full"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileSelect}
          disabled={isUploading}
          className="shrink-0"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Área de drop */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          'hover:border-primary/50 hover:bg-accent/50',
          isUploading && 'border-primary bg-accent'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={triggerFileSelect}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processando imagem...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar ou arraste uma imagem aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  Máximo {maxFileSize}MB • {acceptedTypes.join(', ')}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview da imagem */}
      {imageUrl && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Preview
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearImage}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative">
              {previewError ? (
                <div className="flex items-center justify-center h-32 bg-muted rounded-md">
                  <div className="text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Erro ao carregar imagem</p>
                  </div>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md border"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
              )}
              
              {!previewError && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2 bg-black/50 text-white"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Carregada
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem de erro */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{uploadError}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploadEditor;