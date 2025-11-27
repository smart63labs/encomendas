import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut, RotateCw, Download, Move } from 'lucide-react';

interface ImageViewerProps {
  imageUrl: string;
  fileName?: string;
  onClose?: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, fileName, onClose }) => {
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setError('Erro ao carregar a imagem');
    setLoading(false);
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 5.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.1));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setScale(1.0);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName || 'imagem';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose?.();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case 'r':
        case 'R':
          rotate();
          break;
        case '0':
          resetView();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
          <h3 className="text-lg font-semibold truncate">
            {fileName || 'Imagem'}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetView} className="text-white hover:bg-white hover:bg-opacity-20">
              Resetar
            </Button>
            <Button variant="ghost" size="sm" onClick={rotate} className="text-white hover:bg-white hover:bg-opacity-20">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadImage} className="text-white hover:bg-white hover:bg-opacity-20">
              <Download className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20">
                ×
              </Button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="flex items-center gap-4 text-white">
            <Button variant="ghost" size="sm" onClick={zoomOut} className="text-white hover:bg-white hover:bg-opacity-20">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={zoomIn} className="text-white hover:bg-white hover:bg-opacity-20">
              <ZoomIn className="h-4 w-4" />
            </Button>
            {scale > 1 && (
              <div className="flex items-center gap-1 ml-4 text-xs opacity-70">
                <Move className="h-3 w-3" />
                <span>Arraste para mover</span>
              </div>
            )}
          </div>
        </div>

        {/* Image Container */}
        <div 
          ref={containerRef}
          className="flex-1 flex items-center justify-center overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {loading && (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Carregando imagem...</p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-400">
              <p>{error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-white hover:bg-white hover:bg-opacity-20"
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {!loading && !error && (
            <img
              ref={imageRef}
              src={imageUrl}
              alt={fileName || 'Imagem'}
              className="max-w-none transition-transform duration-200 select-none"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          )}
        </div>

        {/* Help Text */}
        <div className="p-2 bg-black bg-opacity-50 text-white text-xs text-center opacity-70">
          Use as teclas: + (zoom in), - (zoom out), R (rotacionar), 0 (resetar), ESC (fechar)
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;