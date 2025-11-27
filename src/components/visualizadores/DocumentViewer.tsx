import React from 'react';
import PDFViewer from './PDFViewer';
import ImageViewer from './ImageViewer';
import TextViewer from './TextViewer';
import { Button } from '../ui/button';
import { FileX, Download } from 'lucide-react';

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  fileType?: string;
  onClose?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  fileUrl, 
  fileName, 
  fileType, 
  onClose 
}) => {
  const getFileType = (filename: string, mimeType?: string): string => {
    if (mimeType) {
      return mimeType;
    }
    
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
      case 'txt':
        return 'text/plain';
      case 'md':
        return 'text/markdown';
      case 'json':
        return 'application/json';
      case 'xml':
        return 'application/xml';
      case 'csv':
        return 'text/csv';
      case 'html':
      case 'htm':
        return 'text/html';
      case 'css':
        return 'text/css';
      case 'js':
        return 'application/javascript';
      case 'ts':
        return 'application/typescript';
      case 'doc':
      case 'docx':
        return 'application/msword';
      case 'xls':
      case 'xlsx':
        return 'application/vnd.ms-excel';
      case 'ppt':
      case 'pptx':
        return 'application/vnd.ms-powerpoint';
      default:
        return 'application/octet-stream';
    }
  };

  const detectedFileType = getFileType(fileName, fileType);

  const isPDF = detectedFileType === 'application/pdf';
  const isImage = detectedFileType.startsWith('image/');
  const isText = detectedFileType.startsWith('text/') || 
                 detectedFileType === 'application/json' ||
                 detectedFileType === 'application/xml' ||
                 detectedFileType === 'application/javascript' ||
                 detectedFileType === 'application/typescript';

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderizar visualizador específico baseado no tipo de arquivo
  if (isPDF) {
    return (
      <PDFViewer 
        fileUrl={fileUrl} 
        fileName={fileName} 
        onClose={onClose} 
      />
    );
  }

  if (isImage) {
    return (
      <ImageViewer 
        imageUrl={fileUrl} 
        fileName={fileName} 
        onClose={onClose} 
      />
    );
  }

  if (isText) {
    return (
      <TextViewer 
        fileUrl={fileUrl} 
        fileName={fileName} 
        onClose={onClose} 
      />
    );
  }

  // Fallback para tipos de arquivo não suportados
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center">
          <FileX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tipo de arquivo não suportado</h3>
          <p className="text-gray-600 mb-4">
            O arquivo <strong>{fileName}</strong> não pode ser visualizado diretamente.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Tipo detectado: {detectedFileType}
          </p>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={downloadFile} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Baixar arquivo
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Tipos suportados:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>PDFs:</strong> .pdf</div>
            <div><strong>Imagens:</strong> .jpg, .jpeg, .png, .gif, .bmp, .webp, .svg</div>
            <div><strong>Textos:</strong> .txt, .md, .json, .xml, .csv, .html, .css, .js, .ts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;

// Hook para facilitar o uso do DocumentViewer
export const useDocumentViewer = () => {
  const [viewerState, setViewerState] = React.useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    fileType?: string;
  }>({ isOpen: false, fileUrl: '', fileName: '' });

  const openViewer = (fileUrl: string, fileName: string, fileType?: string) => {
    setViewerState({ isOpen: true, fileUrl, fileName, fileType });
  };

  const closeViewer = () => {
    setViewerState({ isOpen: false, fileUrl: '', fileName: '' });
  };

  const ViewerComponent = viewerState.isOpen ? (
    <DocumentViewer
      fileUrl={viewerState.fileUrl}
      fileName={viewerState.fileName}
      fileType={viewerState.fileType}
      onClose={closeViewer}
    />
  ) : null;

  return {
    openViewer,
    closeViewer,
    ViewerComponent,
    isOpen: viewerState.isOpen
  };
};