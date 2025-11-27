import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Download, ZoomIn, ZoomOut, Copy, FileText } from 'lucide-react';
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';

interface TextViewerProps {
  fileUrl: string;
  fileName?: string;
  onClose?: () => void;
}

export const TextViewer: React.FC<TextViewerProps> = ({ fileUrl, fileName, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [highlightedContent, setHighlightedContent] = useState<string>('');
  const [searchResults, setSearchResults] = useState<number>(0);
  const [currentMatch, setCurrentMatch] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { notification, isOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error('Erro ao carregar o arquivo');
        }
        const text = await response.text();
        setContent(text);
        setHighlightedContent(text);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar o documento de texto');
        console.error('Erro ao carregar texto:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [fileUrl]);

  useEffect(() => {
    if (searchTerm && content) {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const matches = content.match(regex);
      setSearchResults(matches ? matches.length : 0);
      
      if (matches && matches.length > 0) {
        const highlighted = content.replace(regex, '<mark class="bg-yellow-300 text-black">$1</mark>');
        setHighlightedContent(highlighted);
        setCurrentMatch(1);
      } else {
        setHighlightedContent(content);
        setCurrentMatch(0);
      }
    } else {
      setHighlightedContent(content);
      setSearchResults(0);
      setCurrentMatch(0);
    }
  }, [searchTerm, content]);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 10));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      showInfo("Copiado!", "Conteúdo copiado para a área de transferência.");
    } catch (err) {
      showError("Erro", "Não foi possível copiar o conteúdo.");
    }
  };

  const downloadFile = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'documento.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scrollToMatch = (direction: 'next' | 'prev') => {
    if (!contentRef.current || searchResults === 0) return;

    const marks = contentRef.current.querySelectorAll('mark');
    if (marks.length === 0) return;

    let newMatch = currentMatch;
    if (direction === 'next') {
      newMatch = currentMatch >= searchResults ? 1 : currentMatch + 1;
    } else {
      newMatch = currentMatch <= 1 ? searchResults : currentMatch - 1;
    }

    setCurrentMatch(newMatch);
    const targetMark = marks[newMatch - 1] as HTMLElement;
    if (targetMark) {
      targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight current match
      marks.forEach(mark => mark.classList.remove('ring-2', 'ring-blue-500'));
      targetMark.classList.add('ring-2', 'ring-blue-500');
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || 'txt';
  };

  const formatContent = (text: string) => {
    // Preservar quebras de linha e espaços
    return text.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold truncate">
              {fileName || 'Documento de Texto'}
            </h3>
            {fileName && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded uppercase">
                {getFileExtension(fileName)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={downloadFile}>
              <Download className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar no texto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              {searchResults > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">
                    {currentMatch} de {searchResults}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => scrollToMatch('prev')}
                    disabled={searchResults === 0}
                  >
                    ↑
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => scrollToMatch('next')}
                    disabled={searchResults === 0}
                  >
                    ↓
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Font Size Controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={decreaseFontSize}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[40px] text-center">{fontSize}px</span>
            <Button variant="outline" size="sm" onClick={increaseFontSize}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Carregando documento...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-red-600">
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div 
              ref={contentRef}
              className="whitespace-pre-wrap font-mono leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ 
                __html: formatContent(highlightedContent) 
              }}
            />
          )}
        </div>

        {/* Footer Info */}
        {!loading && !error && (
          <div className="px-6 py-2 border-t bg-gray-50 text-xs text-gray-500">
            {content.length.toLocaleString()} caracteres • {content.split('\n').length.toLocaleString()} linhas
          </div>
        )}
      </div>
    </div>
  );
};

export default TextViewer;