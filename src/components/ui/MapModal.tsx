import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large' | 'fullscreen';
}

const MapModal: React.FC<MapModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'large' 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const getSizeClasses = () => {
    if (isFullscreen) {
      return 'w-[98vw] h-[98vh] max-w-none';
    }
    
    switch (size) {
      case 'fullscreen':
        return 'w-[98vw] h-[98vh] max-w-none';
      case 'large':
        // Padronizar com MapaRastreamento: max-w-7xl e max-h-[90vh]
        return 'max-w-7xl max-h-[90vh] w-full';
      case 'default':
      default:
        return 'max-w-6xl max-h-[80vh] w-full';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${getSizeClasses()} p-0 gap-0 overflow-hidden`}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {title}
            </DialogTitle>

          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="h-full w-full">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapModal;